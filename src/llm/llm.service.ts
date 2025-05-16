// Imports
import * as puppeteer from 'puppeteer';
import { Env } from 'src/constants/Env';
import { Injectable } from '@nestjs/common';

const llm_session_data = {};

@Injectable()
export class LLMService {
  async initSession(reqData): Promise<{ llm_session_data: any }> {
    // Caching existence
    if (llm_session_data[reqData.sessionId]) {
      return { llm_session_data };
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(Env.llm.one.baseUrl, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector(
      '.inline-flex.items-center.justify-center.rounded-md.text-sm.font-medium.ring-offset-background.transition-colors.focus-visible\\:outline-none.focus-visible\\:ring-2.focus-visible\\:ring-ring.focus-visible\\:ring-offset-2.disabled\\:pointer-events-none.disabled\\:opacity-50.text-primary.underline-offset-4.shadow-none.hover\\:underline.h-8.px-4.py-2.mt-2.underline',
    );

    await page.evaluate(() => {
      const el = document.getElementsByClassName(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary underline-offset-4 shadow-none hover:underline h-8 px-4 py-2 mt-2 underline',
      )[0];
      if (el) (el as HTMLElement).click();
    });

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
    const requestBody = await postBodyPromise;

    await browser.close();

    llm_session_data[reqData.sessionId] = requestBody;
    return { llm_session_data };
  }

  sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
