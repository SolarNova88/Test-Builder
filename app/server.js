const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;
const { scan } = require('./tools/scan');
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

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '/index.html') {
    return serveFile(path.join(appRoot, 'public', 'index.html'), res);
  }

  // Serve /public/* and /data/* directly
  if (urlPath.startsWith('/public/')) {
    return serveFile(path.join(appRoot, urlPath), res);
  }
  if (urlPath.startsWith('/data/')) {
    return serveFile(path.join(appRoot, urlPath), res);
  }
  if (urlPath.startsWith('/categories/')) {
    return serveFile(path.join(projectRoot, urlPath), res);
  }

  // JSON import endpoint
  if (req.method === 'POST' && urlPath === '/api/import') {
    try {
      const body = await readJsonBody(req);
      const category = String(body.category || '').trim();
      const subcategory = String(body.subcategory || '').trim();
      const questions = body.questions;
      if (!category || !subcategory || !Array.isArray(questions)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'category, subcategory, and questions[] are required' }));
      }
      const targetDir = path.join(projectRoot, 'categories', category, subcategory);
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

  // Fallback: try public first
  const candidate = path.join(appRoot, 'public', urlPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return serveFile(candidate, res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Test Builder running at http://localhost:${port}`);
});


