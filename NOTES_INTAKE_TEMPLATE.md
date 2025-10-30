# Notes Intake Template

This template is designed for use with an AI agent (like Cursor) to automate the creation of comprehensive notes. Simply fill in the required fields below, paste your study material, and instruct the agent to process it.

---

## Category (required)

```
Type category name here (e.g., CS Fundamentals, DevOps, Security)
```

## Subcategory (required)

```
Type subcategory name here (e.g., Docker Fundamentals, Kubernetes Advanced, REST APIs)
```

**OR** if notes should be placed directly under the category (no subcategory):

```
Leave blank or write: General
```

## Source Content (Paste Below)

Paste as much study material as you want. The AI will:
1. Break it down into logical sections
2. Format it with consistent Markdown structure
3. Add beginner-friendly explanations
4. Create appropriate file(s) in `notes/<Category>/<Subcategory>/`

```
Paste your content here below:









```

---

## Agent-Powered Workflow (Cursor, etc.)

When using an AI agent, you can simply fill out the fields above and then provide a command like:

**"Follow the Notes Creation Procedure to create/update notes from this content."**

The agent will:
1. Parse the Category, Subcategory, and Source Content.
2. Break content into logical sections (if needed).
3. Format with consistent Markdown structure (headings, lists, code blocks, tables).
4. Add beginner-friendly explanations with "What They Are (Simple Terms)", "Why This Matters", and "Real-World Examples".
5. Create or update files in `notes/<Category>/<Subcategory>/` with proper naming.
6. Run `node app/tools/notes_scan.js` to update `app/data/notes_index.json`.
7. **Clear the Category, Subcategory, and Source Content fields in this template** so it's ready for your next input.

This streamlines the process, allowing you to focus on providing raw study material without manual Markdown formatting or file management.

---

## Optional Settings

### 1) Action

- [ ] Create new notes (new category/subcategory)
- [ ] Update existing notes (add to existing category/subcategory)
- [ ] Split content into multiple files (if content is very large)

### 2) Formatting Preferences

- [ ] Add beginner-friendly explanations (layman's terms, analogies)
- [ ] Include "Real-World Examples" sections
- [ ] Add "Common Pitfalls" sections
- [ ] Add "Best Practices" sections

### 3) Section Breakdown

- Number of sections to create: `<auto-detect or specify number>`
- Section naming: `<numbered prefix (01-, 02-, etc.) or descriptive names>`
- Break at: `<major headings, logical topics, etc.>`

### 4) File Naming

- Prefix: `<01-, 02-, etc. or leave blank>`
- Format: `<kebab-case-slug>`
- Example: `01-docker-fundamentals.md` or `docker-fundamentals.md`

### 5) Notes to Assistant

Any extra instructions or formatting requirements.

---

For detailed procedures and formatting standards, see `NOTES_README_PROCEDURES.md`.

