const fs = require('fs');
const path = require('path');

const categoriesRoot = path.join(__dirname, '..', '..', 'categories');
const outFile = path.join(__dirname, '..', 'data', 'index.json');

function isQuestionsJson(filePath) {
  return path.basename(filePath) === 'questions.json';
}

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[scan] Invalid JSON skipped: ${filePath}`);
    return null;
  }
}

function countQuestions(arr) {
  if (!Array.isArray(arr)) return 0;
  let ok = 0;
  for (const q of arr) {
    if (!q || typeof q !== 'object') continue;
    if (typeof q.question !== 'string') continue;
    if (!Array.isArray(q.choices) || q.choices.length < 2) continue;
    if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex >= q.choices.length) continue;
    ok += 1;
  }
  return ok;
}

function scan() {
  const index = { categories: {}, generatedAt: new Date().toISOString() };

  if (!fs.existsSync(categoriesRoot)) {
    fs.mkdirSync(categoriesRoot, { recursive: true });
  }

  const categories = fs.readdirSync(categoriesRoot).filter(name => {
    const p = path.join(categoriesRoot, name);
    return fs.statSync(p).isDirectory();
  });

  for (const category of categories) {
    const categoryPath = path.join(categoriesRoot, category);
    const subcategories = fs.readdirSync(categoryPath).filter(name => {
      const p = path.join(categoryPath, name);
      return fs.statSync(p).isDirectory();
    });
    if (!index.categories[category]) index.categories[category] = {};
    for (const sub of subcategories) {
      const qPath = path.join(categoryPath, sub, 'questions.json');
      if (!fs.existsSync(qPath)) continue;
      const json = readJsonSafe(qPath);
      if (!json) continue;
      const count = countQuestions(json);
      index.categories[category][sub] = { count };
    }
  }

  fs.writeFileSync(outFile, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(`[scan] Wrote ${outFile}`);
}

if (require.main === module) {
  scan();
}

module.exports = { scan };


