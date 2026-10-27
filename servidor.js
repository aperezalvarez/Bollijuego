const http = require('http');
const salas = {};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const urlLimpia = req.url.split('?')[0];

    if (urlLimpia.startsWith('/salas/')) {
        const partes = urlLimpia.split('/');
        const codigo = partes[2];
        const accion = partes[3];
        const extra = partes[4];

        if (!salas[codigo] && req.method === 'PUT' && accion === 'crear') {
            salas[codigo] = { caso: null, modo: extra, iniciada: false };
        }

        if (!salas[codigo]) {
            res.writeHead(404);
            res.end();
            return;
        }

        if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                if (accion === 'crear') {
                    salas[codigo].caso = JSON.parse(body);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }
        
        if (req.method === 'POST' && accion === 'unirse') {
            salas[codigo].iniciada = true;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
        }

        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (accion === 'estado') {
                res.end(JSON.stringify({ iniciada: salas[codigo].iniciada }));
            } else {
                res.end(JSON.stringify({ caso: salas[codigo].caso, modo: salas[codigo].modo }));
            }
            return;
        }
    }
    res.writeHead(404);
    res.end();
});

server.listen(3000, () => {
});