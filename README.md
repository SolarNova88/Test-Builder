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

#### Agent‑Powered Workflow (Cursor, etc.)

If you use an agent‑powered editor like Cursor, the agent can automate: parsing your paste, generating/normalizing MCQs, writing `questions.json`, running the scanner, and clearing the input blocks in `INTAKE_TEMPLATE.md` for the next run. See the “Using an Agent‑Powered Editor” section inside `INTAKE_TEMPLATE.md`.

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

There are three ways to add questions:

**Method 1: AI Agent Processing** (Recommended if using Cursor)
- Open `INTAKE_TEMPLATE.md` at the project root
- Fill in Category, Subcategory, and Source Content
- Share it with me in Cursor and say: "Follow the Test Question Loading Procedure to create/update category X/subcategory Y from this content"
- I'll extract questions, generate JSON, create files, and run the scanner
- After processing, I'll clear those three fields so it's ready for next time

**Method 2: ChatGPT-Assisted Import** (Recommended for converting text to JSON)
- See "Importing JSON → Method 2: ChatGPT-Assisted JSON Generation" below

**Method 3: Manual JSON Import**
- See "Importing JSON → Method 1: Direct JSON Import" below

See `data/README_PROCEDURES.md` for detailed procedures.

### Importing JSON

**Method 1: Direct JSON Import**
- Open `http://localhost:8080/public/import.html` to paste ready-made JSON
- The app will save it to `categories/<Category>/<Subcategory>/questions.json` and refresh counts

**Method 2: ChatGPT-Assisted JSON Generation** (Recommended for converting text to JSON)
- Open `http://localhost:8080/public/import.html`
- Click **"💬 Get ChatGPT Prompt"** button
- Paste your study material in the textarea (it will be inserted into the prompt automatically)
- The complete prompt with your content will appear in the preview below
- Click **"📋 Copy Full Prompt"** to copy everything to clipboard
- Click **"Open ChatGPT →"** or open ChatGPT manually
- Paste the complete prompt into ChatGPT
- ChatGPT will generate the JSON array in the required format
- Copy the JSON from ChatGPT and paste it into the "Questions JSON Array" textarea on the import page

The ChatGPT prompt includes:
- Exact JSON schema requirements
- Instructions for generating questions, choices, explanations, and difficulty levels
- Your study material already inserted (ready to paste)
- Output format specifications

This workflow makes it easy to convert any text content into properly formatted JSON questions without manual formatting.

### Security (optional but recommended)

- The server binds to `127.0.0.1` (local-only).
- Protect the import endpoint with a token (prevents drive-by requests):
  - Start server with a secret token:
    - macOS/Linux: `IMPORT_TOKEN="your-strong-token" node app/server.js`
    - Windows (PowerShell): `$env:IMPORT_TOKEN="your-strong-token"; node app/server.js`
  - On the import page, enter the same token in the "Import Token" field (sent as `x-import-token`).
- Static and import paths are sanitized and constrained to project folders.

### Secure Setup Procedure (for forks)

1. Clone repo and run once: `node app/tools/scan.js` then `node app/server.js`.
2. Generate a token:
   - In browser: open `/public/import.html` and click "Generate 32‑char token" (copied to clipboard), or use `openssl rand -hex 16`.
3. Create a `.env` file at project root (gitignored). You can copy the example:
   - `cp .env.example .env` (then edit)
   - Set: `IMPORT_TOKEN="YOUR_TOKEN_HERE"`
4. Restart server: `node app/server.js` (the server auto-loads `.env`).
5. On `/public/import.html`, either leave token blank (server already has it) or paste the same token. Import your JSON safely.


