# Deudalaya Website Instructions

## Required completion workflow for website tasks

After completing each user-requested website task:

1. Review every file changed for that task and inspect the complete diff for accidental or unrelated changes.
2. Run the relevant tests and checks before reporting completion.
3. If all relevant checks pass, automatically commit and push only the task-related changes to the GitHub `main` branch. Do not ask for confirmation again before this commit and push.
4. If any relevant check fails or cannot be completed, do not commit or push. Report the failure or blocker.
5. Preserve all changes that existed before the task. Never reset, overwrite, discard, or stage pre-existing user changes. If task changes cannot be isolated safely from pre-existing changes, stop before committing or pushing and report why.
6. Never delete, replace, or modify unrelated features or files.
7. Never deploy unrelated changes. Push only the changes requested for the current task; if unrelated pending changes would be included, do not push.
8. Report the changed files, checks and results, commit ID (if created), and push result.
