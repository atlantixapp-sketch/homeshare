/**
 * @typedef {import('http').IncomingMessage} IncomingMessage
 * @typedef {import('http').ServerResponse} ServerResponse
 * @typedef {import('http').Server} HttpServer
 */

const { createServer } = require('http');
const next = require('next');

// Importar el servidor de sockets desde la carpeta compilada
const { initSocketServer } = require('./dist/lib/socket-server');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const hostname = '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  /** @type {HttpServer} */
  const server = createServer((req, res) => {
    return handle(req, res);
  });
  
  // Inicializar Socket.io
  initSocketServer(server);

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> 🏠 HomeShare listo en http://localhost:${port}`);
    console.log(`> 📱 Otros dispositivos: http://[TU-IP-LOCAL]:${port}`);
  });
});