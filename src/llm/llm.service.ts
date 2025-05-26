// Imports
import * as puppeteer from 'puppeteer';
import { Env } from 'src/constants/Env';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ApiService } from 'src/utils/api.service';
import { nOneCompletionChat } from 'src/constants/network';

const llm_session_data = {};

@Injectable()
export class LLMService implements OnModuleInit {
  constructor(private readonly api: ApiService) {}

  onModuleInit() {
    this.initPrePlannedSession();
  }

  private async initPrePlannedSession() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await this.initSession({ sessionId: 'pre_planned_01' }).catch((_) => {});

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await this.initSession({ sessionId: 'pre_planned_02' }).catch((_) => {});

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await this.initSession({ sessionId: 'pre_planned_03' }).catch((_) => {});

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await this.initSession({ sessionId: 'pre_planned_04' }).catch((_) => {});

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await this.initSession({ sessionId: 'pre_planned_05' }).catch((_) => {});
  }

  private getPrePlannedSessionId() {
    const list = [
      'pre_planned_01',
      'pre_planned_02',
      'pre_planned_03',
      'pre_planned_04',
      'pre_planned_05',
    ];
    return this.getRandomElement(list);
  }

  async initSession(reqData): Promise<{ llm_session_data: any }> {
    // Caching existence
    if (llm_session_data[reqData.sessionId]) {
      return { llm_session_data };
    }

    const browser = await puppeteer.launch({
      headless: 'new', // ✅ instead of true
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(Env.llm.one.baseUrl, {
      waitUntil: 'domcontentloaded',
    });

    // await page.waitForSelector(
    //   '.inline-flex.items-center.justify-center.rounded-md.text-sm.font-medium.ring-offset-background.transition-colors.focus-visible\\:outline-none.focus-visible\\:ring-2.focus-visible\\:ring-ring.focus-visible\\:ring-offset-2.disabled\\:pointer-events-none.disabled\\:opacity-50.text-primary.underline-offset-4.shadow-none.hover\\:underline.h-8.px-4.py-2.mt-2.underline',
    // );

    // await page.evaluate(() => {
    //   const el = document.getElementsByClassName(
    //     'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary underline-offset-4 shadow-none hover:underline h-8 px-4 py-2 mt-2 underline',
    //   )[0];
    //   if (el) (el as HTMLElement).click();
    // });

    await this.sleep(2500);
    await page.waitForSelector('#chat-input-box');
    await page.type('#chat-input-box', 'Hello');

    // Set up the Promise to capture POST request before clicking
    const postBodyPromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000); // timeout after 10s

      const onRequest = (request) => {
        if (
          request.method() === 'POST' &&
          request.url() === Env.llm.one.baseUrl + 'api/chat'
        ) {
          clearTimeout(timeout);
          resolve(request.postData());
        }
      };

      page.on('request', onRequest);
    });

    // Now click submit button, triggering the POST request
    await page.waitForSelector('#prompt-form-send-button');
    await page.click('#prompt-form-send-button');

    // Wait for the POST body to be captured
    let requestBody: any = await postBodyPromise;

    const cookies = await page.cookies();
    const render_app_version_affinity = cookies.find(
      (el) => el.name == 'render_app_version_affinity',
    ).value;
    const sessionId = cookies.find((el) => el.name == 'sessionId').value;
    const cookieStr = `render_app_version_affinity=${render_app_version_affinity}; sessionId=${sessionId}`;

    await browser.close();

    requestBody = JSON.parse(requestBody);
    requestBody.cookieStr = cookieStr;
    llm_session_data[reqData.sessionId] = requestBody;
    return { llm_session_data };
  }

  async completion(reqData) {
    const prompt = reqData.prompt;
    let sessionId = reqData.sessionId;

    if (!sessionId) {
      sessionId = this.getPrePlannedSessionId();
    }

    if (!llm_session_data[sessionId]) {
      await this.initSession({ sessionId });
    }
    const body = JSON.parse(JSON.stringify({ ...llm_session_data[sessionId] }));
    body.messages[0].content = prompt;

    const headers = { cookie: body.cookieStr, origin: Env.llm.one.origin };
    delete body.cookieStr;
    let response = await this.api.post(nOneCompletionChat, body, headers);

    if (typeof response == 'string') {
      try {
        response = response.replace('```json', '');
        response = response.replace('```', '');
        response = response.replace('nest-backend-structure.json', '');
        response = response.replace('code-structure.json', '');
        response = response.replace('code-structure/folder-structure.json', '');
        response = response.replace('``', '');
        response = response.trim();
        response = JSON.parse(response);
      } catch (error) {
        console.log(response);
      }
    }

    return response;
  }

  sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private getRandomElement<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  sanitizeJsonResponse(raw_response) {
    const match = raw_response
      .trim()
      .match(/^`([^`]+)`\n([a-zA-Z]+)\n([\s\S]+)$/);
    if (match) {
      // Code content as a string from response
      if (match[3]) {
        if (match[3].includes('"code_content": ')) {
          try {
            if (match[3].endsWith('`')) {
              match[3] = match[3].replace(/`/g, '');
            }
            console.log('2');
            return JSON.parse(match[3]).code_content;
          } catch (error) {
            console.log({ error });
          }
        }
        console.log('1');
        if (match[3].endsWith('`')) {
          match[3] = match[3].replace(/`/g, '');
        }
        return match[3];
      }
    } else {
      let match_4_str = this.extractCodeAfterFilenameBlock(raw_response);
      if (match_4_str.includes('"code_content": ')) {
        try {
          if (match_4_str.endsWith('`')) {
            match_4_str = match_4_str.replace(/`/g, '');
          }
          console.log('3');
          return JSON.parse(match_4_str).code_content;
        } catch (error) {
          console.log({ error });
        }
      }
      console.log('4');
      return match_4_str;
    }
  }

  private extractCodeAfterFilenameBlock(response: string): string {
    const lines = response.trim().split('\n');

    // If first line is a filename, skip it and blank lines
    if (/^`.*`$/.test(lines[0])) {
      // Find the first non-blank line after the filename line
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
          // Return everything from that line onward as code
          return lines.slice(i).join('\n');
        }
      }
    }

    return response.trim(); // fallback: return the whole thing
  }
}
