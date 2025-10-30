const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const notesRoot = path.join(projectRoot, 'notes');
const outFile = path.join(__dirname, '..', 'data', 'notes_index.json');

function scanDir(dir) {
  const result = {};
  if (!fs.existsSync(dir)) return result;
  const cats = fs.readdirSync(dir).filter(d => fs.statSync(path.join(dir, d)).isDirectory());
  for (const cat of cats) {
    const catPath = path.join(dir, cat);
    const entries = fs.readdirSync(catPath);
    const subs = entries.filter(d => fs.statSync(path.join(catPath, d)).isDirectory());
    const rootFiles = entries.filter(f => f.toLowerCase().endsWith('.md'));
    result[cat] = {};
    if (rootFiles.length) {
      // Place markdown files directly under the category into a default "General" group
      result[cat]['General'] = rootFiles.map(f => ({ title: path.basename(f, '.md'), path: `/notes/${cat}/${f}` }));
    }
    for (const sub of subs) {
      const subPath = path.join(catPath, sub);
      const files = fs.readdirSync(subPath).filter(f => f.toLowerCase().endsWith('.md'));
      result[cat][sub] = files.map(f => ({ title: path.basename(f, '.md'), path: `/notes/${cat}/${sub}/${f}` }));
    }
  }
  return result;
}

function main() {
  if (!fs.existsSync(notesRoot)) fs.mkdirSync(notesRoot, { recursive: true });
  const index = { notes: scanDir(notesRoot), generatedAt: new Date().toISOString() };
  fs.writeFileSync(outFile, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(`[notes-scan] Wrote ${outFile}`);
}

if (require.main === module) main();
module.exports = { main };


