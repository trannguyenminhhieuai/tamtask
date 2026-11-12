# Workspace Guidelines & Mouse-1 Guard (Fast Autonomous Coding)

This workspace is integrated with **Mouse-1 Safeguards** via Antigravity lifecycle hooks (`.agents/hooks.json`).

### 1. Fast Development & Autonomy Directive:
- **Code Proactively**: Implement components, pages, APIs, and types swiftly without asking unnecessary permissions for standard coding tasks.
- **Mouse-1 Automated Guardrails**: All tool executions (`run_command`, edits, builds) are automatically pre-screened in ~100ms by Mouse-1 to ensure safety while enabling rapid pair-programming.

### 2. Guardrails Enforced by Mouse-1:
1. **Hard Deny (Immediate block):**
   - Dropping or deleting database tables or production collections without confirmation.
   - Exposing `.env` files, raw credentials, or secret keys in public commits or logs.
   - Destructive system-level commands (e.g. `rm -rf /`, formatting, deleting critical files).
2. **Soft Deny (Requires Review):**
   - Publishing packages to external registries (npm, pypi).
   - Direct force-pushing to main remote branches.
3. **Allowed Operations (Proceed Fast):**
   - Reading, viewing, searching, creating, and editing code files, documentation, and tests in the workspace.
   - Running test suites (`npm test`, `npm run dev`, `npm run build`, `pytest`, `python`).
   - Standard local development commands.

