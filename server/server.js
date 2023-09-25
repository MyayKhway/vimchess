const http = require('http');
const express = require('express');
const socketio = require('socket.io');
let games = {};
let game_index = 0;

const app = express();
app.use(express.static(`${__dirname}/../client`));

const ini_board = 'r7/8/8/8/8/8/PPPPPPPP/RNBQKBNR';
/*const ini_board = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';*/
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
    fen = '';
    console.log('User Connected');
    sock.on('piece captured', (fen, sock_id) => {
        if (games[game_index]['black'] == sock_id) fen = fen.split("").reverse().join("");
        fen = fen;
        console.log(fen, fen.toUpperCase());
        if (fen.toUpperCase() == fen) {
            io.emit("white_victory");
        }else if (fen.toLowerCase() == fen) {
            io.emit("black_victory");
        }
        io.emit('board update', fen); /* TODO: implement rooms for multiple games */
    }
    );
    sock.on('piece moved', (fen, sock_id) => {
        if (games[game_index]['black'] == sock_id) fen = fen.split("").reverse().join("");
        fen = fen;
        io.emit('board update', fen);
    });
    sock.on('game create', (sock_id,) => {
        fen = ini_board;
        games[game_index] = {
            white: sock_id,
            board: fen,
            black: 'not_assigned',
        };
        sock.emit('game created', games[game_index]);
    })
    sock.on('game join', (sock_id, game_id) => {
        if (game_id == null) sock.emit('game creation failed');
        games[game_id]['black'] = sock_id;
        sock.emit('game created', games[game_id]);
    })
    setInterval(() => {
    }, 300);
});

server.on('error', (err) => console.error(err));

server.listen(8080, () => {
    console.log('server is ready');
})
