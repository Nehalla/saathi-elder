# Ideasprint Antigravity Starter Files

This pack contains workspace instructions and one reusable Antigravity skill for a timed hackathon prototype.

## Contents

- `AGENTS.md` — project-wide instructions Antigravity should follow.
- `.agents/skills/ideasprint-prototype/SKILL.md` — a reusable workflow for scoping, building, testing, and demoing a prototype.

## Install into your project

1. Unzip this pack.
2. Open your actual project folder in Antigravity (the folder where your app's `package.json` or source files live). Do not open only the ZIP or only the `.agents` subfolder.
3. Copy `AGENTS.md` into that project root.
4. Copy the entire `.agents` folder into the same project root. If `.agents` already exists, merge folders instead of replacing the existing contents.
5. Keep the names exact: `AGENTS.md` and `.agents/skills/ideasprint-prototype/SKILL.md`.
6. If the agent was already open, start a fresh conversation or reload the workspace so it can discover the new skill.

Expected layout:

```text
your-project/
├── AGENTS.md
├── .agents/
│   └── skills/
│       └── ideasprint-prototype/
│           └── SKILL.md
├── package.json      # if applicable to your app
└── ...
```

## Verify that it works

In Antigravity, ask:

> Read the workspace instructions. Summarize the key project rules. Then use the `ideasprint-prototype` skill to plan a tiny feature, but do not modify files yet. Tell me which skill you found and how you will verify the feature.

The agent should describe the time-boxed prototype workflow and mention verification. If it doesn't recognize the skill, check the folder structure and YAML frontmatter, then reload the workspace or start a fresh agent conversation. You can also explicitly say: `Use the ideasprint-prototype skill.`

## On competition day

Replace the placeholder theme/problem in your prompt with the actual announced challenge. Ask the agent to:

1. Inspect the workspace and current app.
2. Propose an achievable MVP and acceptance criteria.
3. Build one complete user journey first.
4. Test the real running app and fix blockers.
5. Add AI only after the core journey works.
6. Report verified functionality, run commands, limitations, and demo steps.

## Important

These files guide Antigravity; they do not install MCP servers, configure API keys, create a backend, or guarantee that tests will pass. Test your environment and any required MCP integrations before the event. Never commit real secrets.
