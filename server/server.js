const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
app.use(express.static(`${__dirname}/../client`));

const server = http.createServer(app);
const io = socketio(server, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});

io.on('connection', (sock) => {
    console.log('User Connected');
    sock.on('piece captured', (data) => console.log(data));
})

server.on('error', (err) => console.error(err));

server.listen(8080, () => {
    console.log('server is ready');
})