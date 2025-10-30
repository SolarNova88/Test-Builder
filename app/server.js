const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;
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

const server = http.createServer((req, res) => {
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


