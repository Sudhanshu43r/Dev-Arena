# Dev-Arena Workspace Guidelines & Agent Rules

## 1. TypeScript & Architecture Guidelines
- **Functional Style (No Classes)**:
  - Do NOT use classes for services, controllers, routes, or helper modules.
  - Use standalone exported functions (e.g., `export async function registerUser(...)`).
  - Pass handlers directly to Express routers without `this` binding wrappers.
- **Prisma Client**:
  - Always use a singleton instance attached to `globalThis` in development to avoid PostgreSQL connection pool leaks during hot-reloading.
- **Authentication Standards**:
  - Passwords: Hash using `argon2`.
  - Access Tokens: Short-lived (`15m`), passed in authorization headers or response payload.
  - Refresh Tokens: Long-lived (`7d`), stored in `HttpOnly`, `SameSite` cookies with token rotation and reuse detection.
  - Validation: Use `zod` schemas for all incoming HTTP request bodies.

## 2. Agent Interaction & File Modification Rules
- **Explicit Output Preference**:
  - When the user asks to "give me code" or explicitly says "don't write the code by yourself", do NOT modify workspace files directly using write tools.
  - Output complete, production-ready TypeScript code directly in the response so the user can review and copy it.
