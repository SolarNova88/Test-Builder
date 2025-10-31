const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const notesRoot = path.join(projectRoot, 'notes');
const outRoot = path.join(projectRoot, 'app', 'data', 'flashcards');
const categoriesRoot = path.join(projectRoot, 'categories');

function readFileUtf8(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function slugId(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 _.,&\-/]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s/]+/g, '-');
}

function cleanText(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

// Very simple Markdown paragraph splitter
function splitParagraphs(md) {
  const parts = md.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  return parts;
}

// Extract heading text map: heading -> following paragraph
function extractFromHeadings(md) {
  const lines = md.split(/\r?\n/);
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i]);
    if (!m) continue;
    const term = cleanText(m[2].replace(/[*_`~]/g, ''));
    // capture next 1-3 non-empty lines as definition
    let def = '';
    for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
      const l = lines[j].trim();
      if (!l) {
        if (def) break;
        else continue;
      }
      if (/^#{1,6}\s+/.test(l)) break;
      if (/^[-*+]\s+/.test(l)) break; // likely a list, skip as definition
      def += (def ? ' ' : '') + l.replace(/[*_`~]/g, '');
      if (def.length > 260) break;
    }
    def = cleanText(def);
    if (term && def && /\b(is|are|means|refers to|represents|defines|describes)\b/i.test(def)) {
      results.push({ term, definition: def });
    }
  }
  return results;
}

// Extract from definition-like lines: "Term: definition" or "Term — definition"
function extractFromInlineDefs(md) {
  const results = [];
  const lines = md.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim().replace(/[*_`~]/g, '');
    if (!line) continue;
    const m = /^[-*+]?\s*([A-Z][A-Za-z0-9 /&()_.:,-]{2,})\s*[:\u2014\u2013-]\s+(.{10,})$/.exec(line);
    if (m) {
      const term = cleanText(m[1]);
      let def = cleanText(m[2]);
      if (def.length > 320) def = def.slice(0, 317) + '...';
      // Filter out non-definitional or meta phrases
      if (/\b(this section|we will|in this chapter|example:)\b/i.test(def)) continue;
      if (term && def) results.push({ term, definition: def });
    }
  }
  return results;
}

// Extract from sentences like "X is ..." at paragraph starts
function extractFromIsSentences(md) {
  const results = [];
  const paras = splitParagraphs(md);
  for (const p of paras) {
    const firstSentence = p.split(/(?<=[.!?])\s+/)[0] || '';
    const m = /^([A-Z][A-Za-z0-9 /&()_.,-]{2,}?)\s+(is|are)\s+(.{10,})$/i.exec(firstSentence.trim());
    if (m) {
      const term = cleanText(m[1]);
      let def = cleanText(firstSentence.trim());
      if (def.length > 240) def = def.slice(0, 237) + '...';
      if (/\b(this section|we will|let's|you can)\b/i.test(def)) continue;
      if (term && def) results.push({ term, definition: def });
    }
  }
  return results;
}

function scoreDefinition(term, def) {
  if (!term || !def) return 0;
  const len = def.length;
  // Ideal length 40–180 chars
  let score = 0;
  if (len >= 40 && len <= 180) score += 3; else if (len >= 25 && len <= 220) score += 1;
  // Term near start
  const idx = def.toLowerCase().indexOf(term.toLowerCase().split(' ')[0]);
  if (idx === 0) score += 3; else if (idx > 0 && idx < 40) score += 1;
  // Definitional verbs
  if (/\b(is|are|means|refers to|represents|defines|describes)\b/i.test(def)) score += 2;
  // Penalize meta language
  if (/\b(this section|we will|let's|you can|for example)\b/i.test(def)) score -= 3;
  // Avoid questions
  if (/[?]$/.test(def)) score -= 2;
  return score;
}

function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDefCardFromQuestion(q) {
  if (!q || typeof q.question !== 'string') return null;
  const text = q.question.trim();
  let term = null;
  // Patterns to extract term
  let m = /^What is\s+(.+?)\?$/i.exec(text);
  if (m) term = m[1];
  if (!term) {
    m = /^Which of the following (?:best )?describes\s+(.+?)\?$/i.exec(text);
    if (m) term = m[1];
  }
  if (!term) {
    m = /^(.+?)\s+(?:is|are|refers to|means)\b/i.exec(text);
    if (m) term = m[1];
  }
  if (!term) return null;
  term = cleanText(term.replace(/^["'`(]+|["'`)]+$/g, ''));
  // Definition from explanation preferred
  let def = (q.explanation && String(q.explanation).trim()) || '';
  if (!def && Array.isArray(q.choices) && typeof q.answerIndex === 'number') {
    const ans = q.choices[q.answerIndex];
    if (typeof ans === 'string') def = ans.trim();
  }
  def = cleanText(def);
  if (!term || !def) return null;
  const sc = scoreDefinition(term, def);
  if (sc <= 1) return null;
  return { term, definition: def, score: sc };
}

function mergeDefinitionalMCQsIntoDecks() {
  // Build map of existing deck files by normalized name per top-level category
  const deckMap = new Map(); // key: catPath => Map(normalizedDeckName => filePath)
  function indexDecks(dir, catPath) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      if (f.isDirectory()) {
        indexDecks(path.join(dir, f.name), path.join(catPath, f.name));
      } else if (f.isFile() && f.name.toLowerCase().endsWith('.json')) {
        const deckName = f.name.replace(/\.json$/i, '');
        const key = catPath;
        if (!deckMap.has(key)) deckMap.set(key, new Map());
        deckMap.get(key).set(normalizeName(deckName), path.join(dir, f.name));
      }
    }
  }
  indexDecks(outRoot, '');

  // Walk categories for questions
  if (!fs.existsSync(categoriesRoot)) return;
  const cats = fs.readdirSync(categoriesRoot).filter(d => fs.statSync(path.join(categoriesRoot, d)).isDirectory());
  for (const cat of cats) {
    const catPath = path.join(categoriesRoot, cat);
    const subs = fs.readdirSync(catPath).filter(d => fs.statSync(path.join(catPath, d)).isDirectory());
    for (const sub of subs) {
      const qPath = path.join(catPath, sub, 'questions.json');
      if (!fs.existsSync(qPath)) continue;
      let questions;
      try { questions = JSON.parse(fs.readFileSync(qPath, 'utf8')); } catch { continue; }
      if (!Array.isArray(questions)) continue;
      const extracted = [];
      for (const q of questions) {
        const card = extractDefCardFromQuestion(q);
        if (card) extracted.push(card);
      }
      if (!extracted.length) continue;

      // Find matching deck file under outRoot/<cat>/(sub or similar).json
      // Try cat/sub first
      const catKey = path.join('', cat);
      const deckNameCandidates = [sub, normalizeName(sub)];
      let deckFile = null;
      // Try direct matching in cat root
      const catDecks = deckMap.get(catKey) || new Map();
      for (const name of deckNameCandidates) {
        const f = catDecks.get(normalizeName(name));
        if (f) { deckFile = f; break; }
      }
      // Try nested under cat/sub
      if (!deckFile) {
        const nestedKey = path.join(catKey, sub);
        const nestedDecks = deckMap.get(nestedKey) || new Map();
        for (const name of deckNameCandidates) {
          const f = nestedDecks.get(normalizeName(name));
          if (f) { deckFile = f; break; }
        }
      }
      if (!deckFile) continue;

      // Merge cards into deck
      let deckJson = [];
      try { deckJson = JSON.parse(fs.readFileSync(deckFile, 'utf8')); } catch {}
      const byTerm = new Map(deckJson.map(c => [normalizeName(c.term), c]));
      let added = 0;
      for (const c of extracted) {
        const key = normalizeName(c.term);
        if (byTerm.has(key)) continue;
        deckJson.push({ id: slugId(c.term).slice(0, 80), term: c.term, definition: c.definition, source: `/categories/${cat}/${sub}/questions.json` });
        byTerm.set(key, true);
        added += 1;
      }
      if (added) {
        fs.writeFileSync(deckFile, JSON.stringify(deckJson, null, 2) + '\n', 'utf8');
        console.log(`[notes→flashcards] Merged ${added} MCQ defs into ${deckFile}`);
      }
    }
  }
}

function dedupeCards(cards) {
  const seen = new Set();
  const out = [];
  for (const c of cards) {
    const key = `${c.term.toLowerCase()}\u0000${c.definition.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function buildCardsFromMarkdown(md, sourcePath) {
  const all = [];
  all.push(...extractFromInlineDefs(md));
  all.push(...extractFromHeadings(md));
  all.push(...extractFromIsSentences(md));

  // Group by term and keep best-scoring definition
  const byTerm = new Map();
  for (const c of all) {
    const t = cleanText(c.term);
    const d = cleanText(c.definition);
    if (!t || !d) continue;
    const sc = scoreDefinition(t, d);
    if (sc <= 0) continue;
    const prev = byTerm.get(t);
    if (!prev || sc > prev.score) byTerm.set(t, { term: t, definition: d, score: sc });
  }
  // Map to cards and limit per deck
  const cards = Array.from(byTerm.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map(c => ({
      id: slugId(c.term).slice(0, 80) || slugId(path.basename(sourcePath, '.md')),
      term: c.term,
      definition: c.definition,
      source: sourcePath
    }));
  return cards;
}

function generateForFile(absPath, relPath) {
  const md = readFileUtf8(absPath);
  if (!md) return null;
  const cards = buildCardsFromMarkdown(md, `/${relPath.replace(/\\/g, '/')}`);
  return cards && cards.length ? cards : null;
}

function writeDeck(categorySegments, deckName, cards) {
  const categoryDir = path.join(outRoot, ...categorySegments);
  ensureDir(categoryDir);
  const outFile = path.join(categoryDir, `${deckName}.json`);
  fs.writeFileSync(outFile, JSON.stringify(cards, null, 2) + '\n', 'utf8');
  return outFile;
}

function titleFromFilename(name) {
  const base = name.replace(/\.md$/i, '')
    .replace(/^\d+[-_.\s]*/, '')
    .replace(/[\-_]+/g, ' ')
    .trim();
  return base || name.replace(/\.md$/i, '');
}

function walkNotes() {
  if (!fs.existsSync(notesRoot)) return [];
  const results = [];
  const cats = fs.readdirSync(notesRoot).filter(d => fs.statSync(path.join(notesRoot, d)).isDirectory());
  for (const cat of cats) {
    const catPath = path.join(notesRoot, cat);
    // Direct files
    const rootFiles = fs.readdirSync(catPath).filter(f => f.toLowerCase().endsWith('.md'));
    for (const file of rootFiles) {
      const abs = path.join(catPath, file);
      const rel = path.relative(projectRoot, abs);
      results.push({ categorySegments: [cat], deckName: titleFromFilename(file), abs, rel });
    }
    // One level subdirectories
    const subs = fs.readdirSync(catPath).filter(d => fs.statSync(path.join(catPath, d)).isDirectory());
    for (const sub of subs) {
      const subPath = path.join(catPath, sub);
      const files = fs.readdirSync(subPath).filter(f => f.toLowerCase().endsWith('.md'));
      for (const file of files) {
        const abs = path.join(subPath, file);
        const rel = path.relative(projectRoot, abs);
        results.push({ categorySegments: [cat, sub], deckName: titleFromFilename(file), abs, rel });
      }
    }
  }
  return results;
}

function main() {
  ensureDir(outRoot);
  const items = walkNotes();
  let totalDecks = 0, totalCards = 0;
  for (const item of items) {
    const cards = generateForFile(item.abs, item.rel);
    if (!cards) continue;
    const outFile = writeDeck(item.categorySegments, item.deckName, cards);
    totalDecks += 1;
    totalCards += cards.length;
    console.log(`[notes→flashcards] Wrote ${outFile} (${cards.length} cards)`);
  }
  // Merge definitional MCQs into existing decks to improve quality
  mergeDefinitionalMCQsIntoDecks();
  console.log(`[notes→flashcards] Done. Decks: ${totalDecks}, Cards: ${totalCards}`);
}

if (require.main === module) main();

module.exports = { main };


