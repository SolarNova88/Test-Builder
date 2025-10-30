# Test Builder Intake Template

Paste your inputs into the three big sections below. Type plain text directly inside the code blocks—no angle brackets needed.

---

## Category (required)

```
Category Name: 
```

## Subcategory (required)

```
Subcategory Name:
```

## Source Content (required)

Paste raw study text or ready-made MCQs. I will either generate MCQs or normalize what you provide.

```
Paste your content here below:











```

---

## Optional Settings

- Action: <create new / update existing>
- Mode: <structured MCQ provided / generate from source text>
- Difficulty: <easy/medium/hard>
- Number of questions to generate (if generating): <e.g., 15>
- Avoid/Prefer topics: <list>
- Explanation style: <concise / detailed>
- Choice count: <4 default>
- ID strategy: <e.g., net-proto-### or leave blank>
- Notes to Assistant: <anything else>

## What I Will Do

- Create/append `categories/<Category>/<Subcategory>/questions.json` per schema.
- Run `node tools/scan.js` to refresh `data/index.json`.
- Verify counts and basic quiz flow.
- Clear Category, Subcategory, and Source Content in this file after processing so it’s ready next time.

For schema and flow, see `data/README_PROCEDURES.md`.

---

## Using an Agent‑Powered Editor (e.g., Cursor)

This template is optimized for agent workflows. When you paste Category, Subcategory, and Source Content in an agent‑powered editor like Cursor, the agent can:

- Parse your content, generate or normalize MCQs, and write JSON to `categories/<Category>/<Subcategory>/questions.json` automatically.
- Run the scanner to update counts and refresh the UI locally.
- Clear the three input blocks in this template after processing so it’s ready for your next paste.

Benefits: faster authoring, fewer manual steps, consistent formatting, and immediate preview in the running app. If not using an agent editor, you can still paste JSON directly via the Import page or follow the procedures to create/update files manually.
