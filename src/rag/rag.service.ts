// Imports
import { QueryTypes } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { LLMService } from 'src/llm/llm.service';
import { sequelize } from './../database/sequelize';

@Injectable()
export class RAGService {
  constructor(private readonly llm: LLMService) {}

  async searchAndAnswer(user_prompt: string) {
    const embeddings = await this.llm.generateEmbeddings([user_prompt]);

    const embedding = embeddings[0];
    const vectorString = `[${embedding.join(',')}]`;

    const topDocs = await sequelize.query(
      `SELECT content, metadata, embedding <-> :embedding::vector AS score
      FROM documents
      ORDER BY score ASC
      LIMIT 5;
      `,
      {
        replacements: { embedding: vectorString },
        type: QueryTypes.SELECT,
      },
    );

    const code_reference = [];
    for (let index = 0; index < topDocs.length; index++) {
      const docData: any = topDocs[index];
      const metadata = docData.metadata ?? {};
      metadata.content = docData.content;

      code_reference.push(metadata);
    }

    const prompt = `
    You are an expert code editor assistant.

    Your task is to respond to a code change request by:
    - Locating the exact code **block** (not line) that needs to be changed
    - Returning a **complete and compilable** replacement of the affected block (e.g., the full function, full variable declaration, full JSX component, or object)
    - **Not responding with a line fragment** under any circumstances

    ---

    ### CODE REFERENCE
    ${JSON.stringify(code_reference, null, 2)}

    ---

    ### USER REQUEST
    ${user_prompt}

    ---

    ### OUTPUT FORMAT (STRICT JSON):
    {
      "filepath": "<relative path of the file>",
      "startLine": <number>,
      "endLine": <number>,
      "replacement": "<the FULL, updated code block that replaces lines from startLine to endLine>"
    }

    ---

    ### CRITICAL RULES — DO NOT IGNORE:

    ❌ NEVER return just one or two modified lines — return the FULL block containing them

    ✅ ALWAYS return the ENTIRE variable/function/component/object affected by the change

    ❌ NEVER guess new lines, paths, or add code not present in the reference

    ✅ If no change is needed, return: { "result": "no change needed" }

    ---

    ### EXAMPLE of INCORRECT (and forbidden):
    {
      "startLine": 20,
      "endLine": 20,
      "replacement": "  gender: 'female'"
    }

    ### EXAMPLE of CORRECT:
    {
      "startLine": 18,
      "endLine": 24,
      "replacement": "const initialFilters = {\\n  platform: 'android',\\n  gender: 'female',\\n  ...\\n};"
    }

    ---

    Only return valid JSON — no comments or explanations.
    Respond now.
    `;

    return await this.llm.completion({ prompt, llm_selection: 2 });
  }
}
