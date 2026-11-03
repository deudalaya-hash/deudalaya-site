# Deudalaya Website Instructions

## Required completion workflow for website tasks

After completing each user-requested website task:

1. Review every file changed for that task and inspect the complete diff for accidental or unrelated changes.
2. Run relevant tests and checks, and report failures, warnings, and build errors accurately. Test results do not block committing or pushing a completed task.
3. Automatically commit the task-specific changes and push them to the GitHub `main` branch without requesting confirmation.
4. Never force-push. If GitHub rejects a push because of conflicts or authentication errors, report the exact reason and retry only after confirming the retry is safe.
5. Preserve all changes that existed before the task. Never reset, overwrite, discard, or stage pre-existing user changes. If task changes cannot be isolated safely from pre-existing changes, do not include those unrelated changes; report the blocker.
6. Never delete, replace, or modify unrelated features or files. Never include unrelated files or changes in a task commit.
7. Never commit passwords, API secrets, private credentials, or other sensitive data.
8. After every push, verify the pushed commit is present on GitHub and report its commit ID, push result, and GitHub Pages deployment status. If deployment status cannot be determined, say so clearly.
