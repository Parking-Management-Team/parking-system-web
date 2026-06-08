---
type: project
created: 2026-05-25
updated: 2026-05-25
---

# Project Conventions

## Git Workflow
- Always create a new dedicated branch for major code changes.
- Branch name format should follow: `feature/[task-slug]` or `fix/[bug-slug]`.

## Facilities & Buildings Configuration
- Building Code must be a unique identifier.
- Building Code character length is limited to a maximum of 20 characters (enforced via client-side `maxLength={20}` and list-duplicate checks).
