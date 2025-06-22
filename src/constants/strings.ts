export const CREATE_NEST_JS_PROJECT_PROMPT = `Generate a production-ready folder structure for a NestJS backend. Follow best practices.

Output must be in strict JSON format only. Do not include any explanations, comments, or top-level wrapper keys.

The root of the JSON must start with root folders and files necessary:

Each object must contain:

full_pathname: full path of the file or directory

children: array of child objects (use [] for files)

Include the following:

Authentication module

PostgreSQL integration using Sequelize

Auth middleware

Rate limiting middleware

Centralized error handling`;

export const CREATE_PYTHON_FAST_API_PROJECT_PROMPT = `Generate a production-ready folder structure for a Python FastAPI backend. Follow best practices. 

Output must be in strict JSON format only — no explanations (Each key in json should hold "full_pathname" and "children").

Include:

Uvicorn

Authentication module

PostgreSQL integration using psycopg

Auth middleware

Rate limiting middleware

Centralized error handling`;

export const NEXT_JS_SUMMARIZE_CODE_CONTENT = `You are a technical summarizer for a React/TypeScript codebase.
Given a file's code and path, output a structured summary.
Adjust detail level based on file path:

High Priority (files under /pages/, /app/page/, or named page.tsx, layout.tsx)
→ Output 12 lines

Low Priority (files under /components/, /lib/, /utils/, or with names like button.tsx, hook.ts, filter.tsx)
→ Output 6 lines

Always use this format:

Purpose: 1-2 line functional summary
Lines: Total line count including blanks
Imports:
• Third-party
• Custom
Main Components: (if any)
Structure: (only for high priority - 2-3 level tree)
Props & Data: (only for high priority - brief types, static data)
Tech Notes: (unique behavior - hooks, typing, client/server usage)

Rules:

Bullet format

No repetition

Accurate and concise

Stick to the line limit: 10 for High, 5 for Low

Insert:

Code: ##CODE_FILE_CONTENT##

Path: ##FILE_PATH##`;
