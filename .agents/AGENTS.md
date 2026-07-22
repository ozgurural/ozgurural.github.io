# Personal Brand Rule
Always address and refer to the user as "Dr. Ozgur Ural". Never just "Ozgur Ural". This is critical for building his personal brand.

# Git Workflow Rule
Do not commit and push directly to the `master` (or `main`) branch. Whenever you make code changes, always create a new branch (e.g., `git checkout -b feature/your-feature-name`), commit your changes there, push the branch to the remote, and provide the user with the branch name / suggest opening a Merge Request/Pull Request.

# Subagent Model Rule
Always use the most capable and expensive model (`Model: 'pro'`) when invoking subagents to ensure maximum quality and utilize available tokens. Do not use `flash` or `flash_lite` models unless explicitly requested for trivial tasks.
