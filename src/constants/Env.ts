// Imports
import * as env from 'dotenv';

env.config();

export const Env = {
  database: {
    postgres: {
      host: process.env.DATABASE_HOST,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
    },
    supabase: {
      postgres: { host: process.env.SUPABASE_HOST },
    },
  },
  llm: {
    one: {
      baseUrl: process.env.LLM_01_BASE_URL,
      origin: process.env.LLM_01_ORIGIN_URL,
    },
    two: {
      baseUrl: process.env.LLM_02_BASE_URL,
      authToken: process.env.LLM_02_AUTH_TOKEN,
    },
    three: {
      authToken: process.env.LLM_03_AUTH_TOKEN,
    },
    openAi: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
};
