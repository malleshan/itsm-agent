# ITSM Agent Project

## Superpowers Reference

Repository cloned from: https://github.com/obra/superpowers
Local path: C:/2026-projects/superpowers

### What it is
Superpowers is a software development methodology for coding agents built on composable skills. It provides a structured workflow that guides agents through brainstorming, planning, TDD implementation, code review, and branch management.

### Core Workflow
1. **brainstorming** - Refines ideas before writing code, saves design document
2. **using-git-worktrees** - Creates isolated workspace on new branch after design approval
3. **writing-plans** - Breaks work into 2-5 minute tasks with exact file paths and verification steps
4. **subagent-driven-development** / **executing-plans** - Dispatches subagents per task with two-stage review
5. **test-driven-development** - Enforces RED-GREEN-REFACTOR cycle
6. **requesting-code-review** - Reviews against plan between tasks
7. **finishing-a-development-branch** - Verifies tests, handles merge/PR/cleanup

### Key Skills Available
- `test-driven-development` - RED-GREEN-REFACTOR cycle
- `systematic-debugging` - 4-phase root cause process
- `brainstorming` - Socratic design refinement
- `writing-plans` - Detailed implementation plans
- `subagent-driven-development` - Fast iteration with two-stage review
- `requesting-code-review` / `receiving-code-review`
- `using-git-worktrees` - Parallel development branches
- `finishing-a-development-branch` - Merge/PR decision workflow

### Philosophy
- Test-Driven Development — write tests first, always
- Systematic over ad-hoc — process over guessing
- YAGNI + DRY — simplicity as primary goal
- Evidence over claims — verify before declaring success

### Installation (Claude Code)
```bash
/plugin install superpowers@claude-plugins-official
```
