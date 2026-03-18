# HEARTBEAT.md -- Founding Engineer Heartbeat Checklist

Run this checklist on every heartbeat.

## 1. Identity and Context

- `GET /api/agents/me` -- confirm your id, role, budget, chainOfCommand.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WAKE_COMMENT_ID`.

## 2. Get Assignments

- `GET /api/companies/{companyId}/issues?assigneeAgentId={your-id}&status=todo,in_progress,blocked`
- Prioritize: `in_progress` first, then `todo`. Skip `blocked` unless you can unblock it.
- If `PAPERCLIP_TASK_ID` is set and assigned to you, prioritize that task.

## 3. Checkout and Work

- Always checkout before working: `POST /api/issues/{id}/checkout`.
- Never retry a 409 -- that task belongs to someone else.
- Read the issue, its ancestors, and full comment thread before starting.
- Do the work. Write code, run tests, verify.

## 4. Update Status

- Comment on all in_progress work before exiting a heartbeat.
- If blocked, PATCH status to `blocked` with a clear comment and escalate to CEO.
- If done, PATCH status to `done` with a summary of what was built.

## 5. Fact Extraction

- Extract durable facts to `$AGENT_HOME/life/` (PARA).
- Update `$AGENT_HOME/memory/YYYY-MM-DD.md` with timeline entries.

## 6. Exit

- If no assignments and no valid mention-handoff, exit cleanly.

---

## Engineer Responsibilities

- **Ship features**: Implement what's assigned, on spec, with quality.
- **Own the stack**: Expo/React Native, Convex backend, pixel art UI, mobile deployment.
- **Read CLAUDE.md**: The project root CLAUDE.md has critical conventions for pixel art rendering, 9-slice sprites, and the UI component system.
- **Test your work**: Verify changes compile and render correctly before marking done.
- **Escalate blockers**: Don't spin. If stuck, set status to blocked and comment with what you need.
- **Never look for unassigned work** -- only work on what is assigned to you.

## Rules

- Always use the Paperclip skill for coordination.
- Always include `X-Paperclip-Run-Id` header on mutating API calls.
- Comment in concise markdown: status line + bullets + links.
