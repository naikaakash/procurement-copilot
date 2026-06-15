# Agent Skill Usage Rule

This workspace uses Agent Skills located in `.agents/skills/`.

For any non-trivial coding, debugging, refactoring, design, testing, documentation, migration, launch, performance, or security task:

1. First inspect `.agents/skills/using-agent-skills/SKILL.md`.
2. Select the most relevant skill or small set of skills based on the user request.
3. Do not load every skill into context at once. Use progressive disclosure: read only the selected `SKILL.md` files needed for the current task.
4. Follow the selected skill workflow before editing files.
5. Prefer this default flow for feature work: `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` → `test-driven-development` → `code-review-and-quality`.
6. For UI/frontend work, include `frontend-ui-engineering`.
7. For bugs, include `debugging-and-error-recovery`.
8. For risky changes, include `security-and-hardening` and/or `performance-optimization` where relevant.
9. Touch only files required for the requested task.
10. At the end, summarize what changed and provide verification evidence, such as tests run, build result, screenshots, logs, or manual checks.

When the user explicitly says "use all skills", treat that as "make all skills available for selection", not "read all skills into context immediately".
