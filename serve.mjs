import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function isLocal(path) {
  const localPath = relative(root, path);
  return !isAbsolute(localPath) && localPath !== '..' && !localPath.startsWith(`..${sep}`);
}

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const { pathname } = new URL(req.url, 'http://127.0.0.1');
    const requestPath = decodeURIComponent(pathname).replace(/^\/+/, '');
    const name = requestPath === '' || requestPath.endsWith('/') ? `${requestPath}index.html` : requestPath;
    const candidate = resolve(root, name);
    const path = isLocal(candidate) ? await realpath(candidate) : null;
    if (!path || !isLocal(path)) {
      res.writeHead(404).end('Not found');
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, {
      'content-type': types[extname(path).toLowerCase()] || 'application/octet-stream',
      'content-length': body.length
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(4174, '127.0.0.1', () => console.log('http://127.0.0.1:4174'));
