const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = path.resolve(process.argv[2] || process.cwd());
const port = Number(process.argv[3] || process.env.PORT || 4174);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-cache',
    'Connection': 'close'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    let pathname = decodeURIComponent(parsed.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.resolve(root, pathname.replace(/^\/+/, ''));
    if (!filePath.startsWith(root + path.sep) && filePath !== root) return send(res, 403, '403');
    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat.isFile()) return send(res, 404, '404');
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache',
        'Connection': 'close'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (err) {
    send(res, 500, String(err && err.stack || err));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`御灵召来预览已启动：http://127.0.0.1:${port}/`);
  console.log(`root=${root}`);
});
