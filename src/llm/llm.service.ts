// Imports
import * as puppeteer from 'puppeteer';
import { Env } from 'src/constants/Env';
import { ApiService } from 'src/utils/api.service';
import {
  nOneCompletionChat,
  nThreeCompletionChat,
} from 'src/constants/network';
import { Injectable, OnModuleInit } from '@nestjs/common';

const llm_session_data = {};

let llm_selection = 2;

@Injectable()
export class LLMService implements OnModuleInit {
  constructor(private readonly api: ApiService) {}

  onModuleInit() {
    this.initPrePlannedSession();
  }

  private async initPrePlannedSession() {
    if (llm_selection != 1) {
      return {};
    }

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

    if (reqData?.llm_selection == 2) {
      return await this.completionLLM2(prompt);
    } else if (reqData?.llm_selection == 3) {
      return await this.completionLLM3(prompt);
    }

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
        if (response.includes('{')) {
          response = JSON.parse(response);
        }
      } catch (error) {
        console.log(response);
      }
    }

    return response;
  }

  async completionLLM2(prompt) {
    const url = Env.llm.two.baseUrl + 'chat/completions';
    const body = {
      stream: true,
      model: 'main_chat',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      params: {},
      tool_servers: [],
      features: {
        image_generation: false,
        code_interpreter: false,
        web_search: false,
        auto_web_search: false,
        preview_mode: false,
      },
      variables: {
        '{{USER_NAME}}': 'Guest-1749374780129',
        '{{USER_LOCATION}}': 'Unknown',
        '{{CURRENT_DATETIME}}': '2025-06-12 00:20:56',
        '{{CURRENT_DATE}}': '2025-06-12',
        '{{CURRENT_TIME}}': '00:20:56',
        '{{CURRENT_WEEKDAY}}': 'Thursday',
        '{{CURRENT_TIMEZONE}}': 'Asia/Calcutta',
        '{{USER_LANGUAGE}}': 'en-US',
      },
      model_item: {
        id: 'main_chat',
        name: 'GLM-4-32B',
        owned_by: 'openai',
        openai: {
          id: 'main_chat',
          name: 'main_chat',
          owned_by: 'openai',
          openai: {
            id: 'main_chat',
          },
          urlIdx: 0,
        },
        urlIdx: 0,
        info: {
          id: 'main_chat',
          user_id: '7080a6c5-5fcc-4ea4-a85f-3b3fac905cf2',
          base_model_id: null,
          name: 'GLM-4-32B',
          params: {
            max_tokens: 8096,
            top_p: 0.95,
            temperature: 0.6,
            top_k: 40,
          },
          meta: {
            profile_image_url: '/static/favicon.png',
            description: 'Great for everyday tasks',
            capabilities: {
              vision: false,
              citations: true,
              preview_mode: true,
              web_search: true,
              language_detection: true,
              restore_n_source: true,
              mcp: false,
            },
            tags: [],
          },
          access_control: null,
          is_active: true,
          updated_at: 1744522361,
          created_at: 1744522361,
        },
        actions: [],
        tags: [],
      },
      chat_id: 'local',
      id: '0288c328-8684-4112-bfb4-1eefd9779eec',
    };
    const headers = {
      Authorization: Env.llm.two.authToken,
    };

    const response = await this.api.post(url, body, headers);
    const spans = response.split('data: ');
    const target_str = spans[spans.length - 1].trim();
    let respo = JSON.parse(target_str);
    respo = respo.data?.data ?? respo.data;
    respo = respo.content;

    if (typeof respo == 'string') {
      try {
        respo = respo.replace('```json', '');
        respo = respo.replace('```', '');
        respo = respo.replace('nest-backend-structure.json', '');
        respo = respo.replace('code-structure.json', '');
        respo = respo.replace('code-structure/folder-structure.json', '');
        respo = respo.replace('``', '');
        respo = respo.trim();

        if (respo.includes('{')) {
          try {
            respo = JSON.parse(respo);
          } catch (error) {
            if (respo.startsWith('{') && !respo.endsWith('}')) {
              respo = respo + '}';
              try {
                respo = JSON.parse(respo);
              } catch (error) {
                console.log(error);
              }
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }

    return respo;
  }

  async completionLLM3(prompt) {
    const url = nThreeCompletionChat + `?key=${Env.llm.three.authToken}`;
    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };
    const response = await this.api.post(url, body);
    const tokenUsage = response.usageMetadata?.totalTokenCount ?? 0;
    console.log({ tokenUsage });

    let respo = (response.candidates ?? [{}])[0].content?.parts[0].text ?? '';
    if (typeof respo == 'string') {
      try {
        respo = respo.replace('```json', '');
        respo = respo.replace('```', '');
        respo = respo.replace('nest-backend-structure.json', '');
        respo = respo.replace('code-structure.json', '');
        respo = respo.replace('code-structure/folder-structure.json', '');
        respo = respo.replace('``', '');
        respo = respo.trim();

        if (respo.includes('{')) {
          respo = JSON.parse(respo);
        }
      } catch (error) {
        console.log(error);
      }
    }

    return respo;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const cleanTexts = texts
      .map((t) => t?.trim())
      .filter((t) => t && t.length > 0);

    const url = 'https://api.openai.com/v1/embeddings';
    const headers = {
      Authorization: `Bearer ${Env.llm.openAi.apiKey}`,
      'Content-Type': 'application/json',
    };
    const body = {
      input: cleanTexts,
      model: 'text-embedding-3-small',
    };

    try {
      const response = await this.api.post(url, body, headers);
      return response.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error(error.response?.data || error.message);
      throw new Error('Batch embedding API call failed');
    }
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
