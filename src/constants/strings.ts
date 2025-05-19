export const CREATE_NEST_JS_PROJECT_PROMPT = `Generate a production-ready folder structure for a NestJS backend. Follow best practices. 

Output must be in strict JSON format only — no explanations (Each key in json should hold "full_pathname" and "children").

Include:

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
