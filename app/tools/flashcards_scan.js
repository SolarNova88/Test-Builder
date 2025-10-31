const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const flashcardsRoot = path.join(projectRoot, 'data', 'flashcards');
const outFile = path.join(projectRoot, 'data', 'flashcards', 'index.json');

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[flashcards-scan] Invalid JSON skipped: ${filePath}`);
    return null;
  }
}

function countValidCards(arr) {
  if (!Array.isArray(arr)) return 0;
  let ok = 0;
  for (const c of arr) {
    if (!c || typeof c !== 'object') continue;
    if (typeof c.term !== 'string' || !c.term.trim()) continue;
    if (typeof c.definition !== 'string' || !c.definition.trim()) continue;
    ok += 1;
  }
  return ok;
}

function scan() {
  const decks = [];
  if (!fs.existsSync(flashcardsRoot)) {
    fs.mkdirSync(flashcardsRoot, { recursive: true });
  }

  const categories = fs.readdirSync(flashcardsRoot).filter(name => {
    const p = path.join(flashcardsRoot, name);
    return fs.statSync(p).isDirectory();
  });

  for (const category of categories) {
    const categoryPath = path.join(flashcardsRoot, category);
    // JSON files directly under the category are decks
    const files = fs.readdirSync(categoryPath).filter(f => f.toLowerCase().endsWith('.json'));
    for (const file of files) {
      const abs = path.join(categoryPath, file);
      const json = readJsonSafe(abs);
      if (!json) continue;
      const count = countValidCards(json);
      const deckTitle = `${category} / ${path.basename(file, '.json')}`;
      const deckId = `${category}/${path.basename(file, '.json')}`;
      const deckPath = `/data/flashcards/${category}/${file}`;
      decks.push({ id: deckId, title: deckTitle, path: deckPath, count });
    }

    // Also support one-level nested subdirectories with deck JSON files
    const subdirs = fs.readdirSync(categoryPath).filter(name => fs.statSync(path.join(categoryPath, name)).isDirectory());
    for (const sub of subdirs) {
      const subPath = path.join(categoryPath, sub);
      const subFiles = fs.readdirSync(subPath).filter(f => f.toLowerCase().endsWith('.json'));
      for (const file of subFiles) {
        const abs = path.join(subPath, file);
        const json = readJsonSafe(abs);
        if (!json) continue;
        const count = countValidCards(json);
        const deckTitle = `${category} / ${sub} / ${path.basename(file, '.json')}`;
        const deckId = `${category}/${sub}/${path.basename(file, '.json')}`;
        const deckPath = `/data/flashcards/${category}/${sub}/${file}`;
        decks.push({ id: deckId, title: deckTitle, path: deckPath, count });
      }
    }
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(decks, null, 2) + '\n', 'utf8');
  console.log(`[flashcards-scan] Wrote ${outFile}`);
}

if (require.main === module) {
  scan();
}

module.exports = { scan };


