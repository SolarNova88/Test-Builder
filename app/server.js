const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;
const { scan } = require('./tools/scan');
const { scan: scanFlashcards } = require('./tools/flashcards_scan');
// Minimal .env loader (no external deps)
try {
  const envPath = path.join(path.join(__dirname, '..'), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
} catch {}
const appRoot = __dirname;
const projectRoot = path.join(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 5 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function safeResolve(baseDir, relPath) {
  const trimmed = String(relPath || '').replace(/^\/+/, '');
  const normalized = path.normalize(trimmed);
  const abs = path.resolve(baseDir, normalized);
  if (!abs.startsWith(baseDir + path.sep)) return null;
  return abs;
}

function sanitizeSegment(name) {
  const s = String(name || '').trim();
  if (!s) return null;
  // Allow letters, numbers, spaces, dashes, underscores, dots, commas, ampersands
  if (!/^[A-Za-z0-9 _.,&-]+$/.test(s)) return null;
  return s;
}

const importToken = process.env.IMPORT_TOKEN || '';

const server = http.createServer(async (req, res) => {
  const urlPathRaw = req.url.split('?')[0];
  const urlPath = decodeURIComponent(urlPathRaw);
  if (urlPath === '/' || urlPath === '/index.html') {
    return serveFile(path.join(appRoot, 'public', 'index.html'), res);
  }

  // Serve /public/* and /data/* directly
  if (urlPath.startsWith('/public/')) {
    const rel = urlPath.replace(/^\/public\//, '');
    const abs = safeResolve(path.join(appRoot, 'public'), rel);
    if (abs) return serveFile(abs, res);
  }
  if (urlPath.startsWith('/data/')) {
    const rel = urlPath.replace(/^\/data\//, '');
    const abs = safeResolve(path.join(appRoot, 'data'), rel);
    if (abs) return serveFile(abs, res);
  }
  if (urlPath.startsWith('/categories/')) {
    const rel = urlPath.replace(/^\/categories\//, '');
    const abs = safeResolve(path.join(projectRoot, 'categories'), rel);
    if (abs) return serveFile(abs, res);
  }
  if (urlPath.startsWith('/notes/')) {
    const rel = urlPath.replace(/^\/notes\//, '');
    const abs = safeResolve(path.join(projectRoot, 'notes'), rel);
    if (abs) return serveFile(abs, res);
  }

  // JSON import endpoint
  if (req.method === 'POST' && urlPath === '/api/import') {
    try {
      // Basic CSRF/token check if set
      if (importToken) {
        const sent = req.headers['x-import-token'];
        if (sent !== importToken) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ 
            error: 'Forbidden: Invalid or missing import token. If you set IMPORT_TOKEN in your .env file, make sure you pasted the same token in the Import Token field on the import page.' 
          }));
        }
      }
      const len = parseInt(req.headers['content-length'] || '0', 10);
      if (len && len > 5 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Payload too large' }));
      }
      const body = await readJsonBody(req);
      const category = sanitizeSegment(body.category);
      const subcategory = sanitizeSegment(body.subcategory);
      const questions = body.questions;
      if (!category || !subcategory || !Array.isArray(questions)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'category, subcategory, and questions[] are required' }));
      }
      const base = path.join(projectRoot, 'categories');
      const targetDir = safeResolve(base, path.join(category, subcategory));
      if (!targetDir) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid category/subcategory' }));
      }
      fs.mkdirSync(targetDir, { recursive: true });
      const targetFile = path.join(targetDir, 'questions.json');
      fs.writeFileSync(targetFile, JSON.stringify(questions, null, 2) + '\n', 'utf8');
      scan();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, saved: targetFile }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Import failed', detail: String(e.message || e) }));
    }
  }

  // Flashcards import endpoint
  if (req.method === 'POST' && urlPath === '/api/import-flashcards') {
    try {
      if (importToken) {
        const sent = req.headers['x-import-token'];
        if (sent !== importToken) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Forbidden: Invalid or missing import token.' }));
        }
      }
      const len = parseInt(req.headers['content-length'] || '0', 10);
      if (len && len > 5 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Payload too large' }));
      }
      const body = await readJsonBody(req);
      const category = sanitizeSegment(body.category);
      const subcategory = sanitizeSegment(body.subcategory);
      const cards = body.cards;
      if (!category || !subcategory || !Array.isArray(cards)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'category, subcategory, and cards[] are required' }));
      }
      // Validate minimal card shape
      for (const c of cards) {
        if (!c || typeof c.term !== 'string' || typeof c.definition !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Each card must include string fields: term and definition' }));
        }
      }
      const base = path.join(appRoot, 'data', 'flashcards');
      const targetDir = safeResolve(base, path.join(category));
      if (!targetDir) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid category' }));
      }
      fs.mkdirSync(targetDir, { recursive: true });
      const fileName = `${subcategory}.json`;
      const targetFile = path.join(targetDir, fileName);
      fs.writeFileSync(targetFile, JSON.stringify(cards, null, 2) + '\n', 'utf8');
      // Rebuild flashcards index
      scanFlashcards();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, saved: targetFile }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Flashcards import failed', detail: String(e.message || e) }));
    }
  }

  // Fallback: try public first
  const absFallback = safeResolve(path.join(appRoot, 'public'), urlPath);
  if (absFallback && fs.existsSync(absFallback) && fs.statSync(absFallback).isFile()) {
    return serveFile(absFallback, res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end('Not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Test Builder running at http://localhost:${port}`);
});


