## Test Builder

A lightweight local web app to turn directory-based categories into interactive quizzes/flashcards using simple JSON files. No heavy UI, just fast loading and clear feedback.

### Quick Start

1. Ensure Node.js is installed (v16+ recommended).
2. From the project root, run:

```bash
node app/server.js
```

3. Open `http://localhost:8080`.

### How Content Is Processed

An AI agent (this assistant) processes the content you paste in `INTAKE_TEMPLATE.md`. It extracts or generates questions, writes JSON into `categories/<Category>/<Subcategory>/questions.json`, and refreshes counts. If you already have JSON, you can also import it directly (see Importing JSON below).

### Project Structure

- `app/` — All app code
  - `public/` — Static frontend (HTML/CSS/JS)
  - `data/index.json` — Auto-generated index with counts
  - `tools/scan.js` — Scans `categories/` and regenerates `app/data/index.json`
  - `server.js` — Tiny static server (no dependencies)
- `categories/` — All category folders with JSON question banks
- `INTAKE_TEMPLATE.md` — Paste study content; I’ll generate/update the quiz

### Data Format (questions.json)

Each subcategory has a `questions.json` array. Example:

```json
[
  {
    "id": "q1",
    "question": "Which protocol is connection-oriented?",
    "choices": ["UDP", "TCP", "ICMP", "ARP"],
    "answerIndex": 1,
    "explanation": "TCP establishes a connection before data transfer.",
    "difficulty": "easy"
  }
]
```

Fields:
- `id`: stable identifier (string)
- `question`: the prompt (string)
- `choices`: list of options (array of strings)
- `answerIndex`: index into `choices` for the correct answer (number)
- `explanation`: optional explanation (string)
- `difficulty`: optional difficulty tag ("easy" | "medium" | "hard")

### Regenerate Index

Run:
```bash
node app/tools/scan.js
```
This scans `categories/` and writes `app/data/index.json` with counts for progress bars.

### Adding/Updating Questions

See `data/README_PROCEDURES.md` for the step-by-step procedure we will follow whenever you paste source material and instruct to create/update a test.

For a quick start, open `INTAKE_TEMPLATE.md` at the project root, fill in the three big inputs (Category, Subcategory, Source Content), and share it with me in Cursor. I’ll take it from there and run the scanner. After processing, I’ll clear those three fields so it’s ready for next time.

### Importing JSON (optional)

- Open `http://localhost:8080/public/import.html` to paste ready-made JSON. The app will save it to `categories/<Category>/<Subcategory>/questions.json` and refresh counts.

### JSON Authoring Prompt (optional)

If you prefer generating JSON yourself with ChatGPT or similar, use this prompt:

Convert the following study content into an array of JSON multiple-choice questions following this exact schema: id (string), question (string), choices (array of 2+ strings), answerIndex (number, 0-based), explanation (string, optional), difficulty (string: easy|medium|hard, optional). Only return valid JSON (no commentary).


