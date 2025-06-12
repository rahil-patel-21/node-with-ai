// Imports
import * as env from 'dotenv';

env.config();

export const Env = {
  llm: {
    one: {
      baseUrl: process.env.LLM_01_BASE_URL,
      origin: process.env.LLM_01_ORIGIN_URL,
    },
    two: {
      baseUrl: process.env.LLM_02_BASE_URL,
      authToken: process.env.LLM_02_AUTH_TOKEN,
    },
  },
};
