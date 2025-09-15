## Jira stories in repo

This directory tracks Jira stories alongside the codebase for easier planning and review.

## How to add your 21 stories

You can provide stories in any of these formats:

- Markdown: one file per story using `TEMPLATE.md`
- CSV export from Jira (recommended)
- JSON export from Jira

### Option A: Markdown (one-file-per-story)

1. Copy `TEMPLATE.md` to `stories/<JIRA-KEY>.md` for each story
2. Fill out the fields
3. Commit the files

### Option B: CSV

- Export from Jira with columns: `Key,Summary,Issue Type,Priority,Description,Acceptance Criteria,Story Points,Status,Labels,Components,Fix Versions,Assignee,Reporter,Links`
- Save as `docs/jira/stories.csv`
- We'll generate individual Markdown files and a mapping plan from it

### Option C: JSON

- Export Jira issues as JSON and save as `docs/jira/stories.json`

## Conventions

- One story per file in `docs/jira/stories/`
- Use the Jira key as the filename when possible (e.g., `PROJ-123.md`)
- Keep acceptance criteria as bullet points

## Implementation mapping

We will create a mapping plan that links each story to relevant code areas, such as:

- Frontend pages in `src/pages/`
- Shared components in `src/components/`
- Contexts in `src/contexts/`
- Supabase client and data types in `src/lib/` and `src/types/`

Once you add the 21 stories here, we will:

1. Normalize the fields
2. Generate one Markdown file per story (if CSV/JSON provided)
3. Create an index and a code mapping plan to estimate impact and sequence work
