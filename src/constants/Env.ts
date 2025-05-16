// Imports
import * as env from 'dotenv';

env.config();

export const Env = {
  llm: { one: { baseUrl: process.env.LLM_01_BASE_URL } },
};
