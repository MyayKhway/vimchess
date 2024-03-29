const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser')
const socketio = require('socket.io');
const {gameEnd, generateID} = require('./game.js')
let games = {};

const app = express();
app.use(express.static(`${__dirname}/../client/`));
app.use(cookieParser)


/*const ini_board = 'r7/8/8/8/8/8/PPPPPPPP/RNBQKBNR';*/
const ini_board = 'rnbqkbnr/pppppppp/8/8/8/8/8/7R';
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

    sock.on('game create', (sock_id,) => {
        game_code = generateID();
        fen = ini_board;
        games[game_code] = {
            white: sock_id,
            board: fen,
            black: 'not_assigned',
            graveyard: {
                    white: [],
                    black: [],
            },
        };
        sock.join(game_code);
        io.to(game_code).emit('game created', games[game_code], game_code);
    })


    sock.on('piece captured', (fen, sock_id, white_grave, black_grave, game_code) => {
        if (games[game_code]['black'] == sock_id) fen = fen.split("").reverse().join("");
        fen = fen;
        if (gameEnd(fen)) {
            if (fen.toUpperCase() == fen) {
                io.to(games[game_code]['black']).emit("Defeat");
                io.to(games[game_code]['white']).emit("Victory");
            }
            else if (fen.toLowerCase() == fen) {
                io.to(games[game_code]['black']).emit("Victory");
                io.to(games[game_code]['white']).emit("Defeat");
            }
        }
        else io.to(game_code).emit('board update', fen, white_grave, black_grave); 
    }
    );


    sock.on('piece moved', (fen, sock_id, game_code) => {
        if (games[game_code]['black'] == sock_id) fen = fen.split("").reverse().join("");
        fen = fen;
        io.to(game_code).emit('board update', fen);
    });


    sock.on('game join', (sock_id, game_id) => {
        // wrong ID
        if (game_id == null || !games[game_id]) sock.emit('no game_id');

        // check if the black is already taken, if so, say game is full
        else if (games[game_id]['black'] != 'not_assigned') sock.emit('game is full');
        else {
            games[game_id]['black'] = sock_id;
            sock.emit('game created', games[game_id], game_id);
            sock.join(game_id);
        }
        console.log(games);
        console.log(io.sockets.adapter.rooms.get(game_id));
        console.log(io.sockets.adapter.rooms);
    })


    setInterval(() => {
    }, 300);


    sock.on('disconnect', () => {
        console.log('user disconnected.')
    })

});

server.on('error', (err) => console.error(err));

server.listen(8080, () => {
    console.log('server is ready');
})
