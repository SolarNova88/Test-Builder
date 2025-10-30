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
