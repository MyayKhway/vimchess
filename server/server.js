const http = require('http');
const express = require('express');
const socketio = require('socket.io');
let games = {};

const app = express();
app.use(express.static(`${__dirname}/../client`));

const ini_board = 'rnbqkbnr/pppppppp/PPPPPPPP/8/8/8/PPPPPPPP/RNBQKBNR';
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
    sock.on('piece captured', (fen) => {
        console.log(fen);
        sock.emit('board update', fen);
    }
    );
    sock.on('piece moved', (fen) => {
        console.log(fen);
        sock.emit('board update', fen);
    });
    sock.on('game create', (data) => {
        games['random'] = {
            white: data,
            board: ini_board,
            black: 'not_assigned',
        };
        console.log(JSON.stringify(games['random']));
        sock.emit('game created', games['random']);
    })
    sock.on('game join', (data,) => {
        games['random']['black'] = data;
        console.log(JSON.stringify(games['random']));
        sock.emit('game created', games['random']);
    })
});

server.on('error', (err) => console.error(err));

server.listen(8080, () => {
    console.log('server is ready');
})