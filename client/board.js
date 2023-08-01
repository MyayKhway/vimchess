import {FENtoBoard, boardtoFEN} from "./util.js";
const sock = io();
let team = '';
let character_list = new Map();
character_list.set('K', '&#9812');
character_list.set('Q', '&#9813');
character_list.set('R', '&#9814');
character_list.set('B', '&#9815');
character_list.set('N', ' &#9816');
character_list.set('P', '&#9817');
character_list.set('k', '&#9818');
character_list.set('q', '&#9819');
character_list.set('r', '&#9820');
character_list.set('b', '&#9821');
character_list.set('n', '&#9822');
character_list.set('p', '&#9823');
let edges = [
    [0,1,2,3,4,5,6,7,], 
    [56,57,58,59,60,61,62,63], 
    [0,8,16,24,32,40,48,56],
    [7,15,23,31,39,47,55,63]
];
let board = [
['r','n','b','q','k','b','n','r'],
['p','p','p','p','p','p','p','p',],
[null,null,null,null,null,null,null,null,],
[null,null,null,null,null,null,null,null,],
[null,null,null,null,null,null,null,null,],
[null,null,null,null,null,null,null,null,],
['P','P','P','P','P','P','P','P',],
['R', 'N', 'B','Q', 'K', 'B', 'N', 'R'],
];
let selected = -1;
let highlight = 0;
let valid_moves = [];
let white_graveyard = ['P'];
let black_graveyard = [];
let selected_piece = '';
function getunicodecharacter(piece) {
    // given the type and color of the piece
    // get the unicode character for that piece
    if (piece === null) return '';
    return character_list.get(piece);
}

function draw_board(board) {
    $('#board').remove();
    var table = $('<table></table>').attr('id', 'board');
    for(let i = 0; i< board.length; i++) {
        var row = $('<tr></tr>').addClass(i);
        for (let j = 0; j < board[0].length; j++) {
            let unicode_char = getunicodecharacter(board[i][j]);
            if (unicode_char === null) unicode_char = '';
            let row_data = $('<td></td>').addClass(j).html(unicode_char);
            row.append(row_data);
        }
        table.append(row);
    }
    $('.game-view').append(table);
    $('#board tr td').eq(highlight).attr('id', 'highlight');
}

function keydownEvent (e) {
    let rows = $('#board tr').length;
    let columns = $('#board tr:eq(0) td').length;
    let temp;

    if (e.which == 72) {
        // move left "h"
        temp = highlight;
        while (!edges[2].includes(highlight)) {
            temp = temp - 1;
            highlight = temp;
            movehighlight();
            break;
        }
    }
    if (e.which == 76){
        // move right "l"
        temp = highlight;
        while (!edges[3].includes(highlight)) {
            temp = temp + 1;
            highlight = temp;
            movehighlight();
            break;
        }
    }

if (e.which == 75) {
    // move up "k"
    temp = highlight;
    while (!edges[0].includes(highlight)) {
        temp = temp - rows;
        highlight = temp;
        movehighlight();
        break;
    }
}
if (e.which == 74) {
    // move down "j"
    temp = highlight;
    while (!edges[1].includes(highlight)) {
        temp = temp + rows;
        highlight = temp;
        movehighlight();
        break;
    }
}
if (e.which == 13) { // enter key
    // change the selected cell and highlight the valid moves 
    temp = highlight;
    // get the valid moves for the piece
    if (selected === -1) {
    // there is no selected piece yet
    // highlight the valid moves on the board
    selected = highlight;
    let selected_coordinate = [Math.floor(selected/8), selected%8];
    selected_piece = getPiece(selected_coordinate);
    valid_moves = listValidMoves(selected_coordinate, selected_piece);
    displayValidMoves(valid_moves);
    }
    else {
    // have already selected some piece
    // make a move
    let destination_coordinate = [Math.floor(highlight/8), highlight%8];
    move(destination_coordinate);
    }
}    
}

function move(destination) {
    // TODO: check if the move is in valid_moves and move or capture
    // TODO: updates the database
    let contains_bool = valid_moves.some(ele => ele[0] == destination[0] && ele[1] == destination[1]);
    if (!contains_bool) {
        console.log('Not a valid move'); // TODO: implement a UI element to display error messages
        selected = -1;
        valid_moves = [];
        displayValidMoves(valid_moves);
    }
    else {
        let piece_on_attack_square = board[destination[0]][destination[1]];
        if (piece_on_attack_square) {
            // enemy piece on square execute capture
            if (piece_on_attack_square[0] === 'w') {
                white_graveyard.push(piece_on_attack_square);
                sock.emit('piece captured', piece_on_attack_square);
            }
            else {
                black_graveyard.push(piece_on_attack_square);
                sock.emit('piece captured', piece_on_attack_square);
            }
        }
        board[destination[0]][destination[1]] = selected_piece;
        board[Math.floor(selected/8)][selected%8] = null;
        draw_board(board);
        selected = -1;
        valid_moves = [];
        displayValidMoves(valid_moves);
    }
}
function displayValidMoves(moves) {
    // remove the previous moves
    $('.moves').removeClass('moves');
    for (let i = 0; i < moves.length; i++) {
        $('#board tr td').eq((moves[i][0]*8)+ moves[i][1]).addClass('moves');
    }
}
function getPiece(pos) {
    // get the piece on board
    // works with both coordinate and number
    let piece;
    if (Array.isArray(pos)) {
        piece=board[pos[0]][pos[1]];
    }
    else piece = board[Math.floor(pos/8)][pos%8];
    return piece;
}

function listValidMoves(pos, piece,) {
    if (piece ===null || getPiece(pos) === null) {
        // error message 
        console.log('You cannot select the blank square');
        selected = -1;
        return [];
    }
    if (!same_team(piece)) {
        // error message 
        console.log('You cannot select the enemies piece')
        return [];
    }
    console.log("The piece you picked was", piece);
    switch(piece) {
        case 'R':
            return rook_moves(pos);
        case 'B':
            return bishop_moves(pos);
        case 'Q':
            return rook_moves(pos).concat(bishop_moves(pos));
        case 'K':
            return king_moves(pos);
        case 'N':
            return knight_moves(pos);
        case 'P':
            return pawn_moves(pos);
        default:
            console.log(`No piece named${piece}`);
    }
}

function pawn_moves(pos, team) {
    // check the square right in front if it is ocuppied by a friendly piece
    // check the second square in front if it is ocuppied by a friendly piece
    // if not add each square to the moves
    // check the capturable square on the board or not
    // if on the board, check if it is occupied by an enemies' piece
    // if so add to the moves
    let moves = [];
    if (team == 'w') {
        if (pos[0]-1 >= 0) {
            // the square is in bound
            if (board[pos[0]-1][pos[1]] === null) {
                moves.push([pos[0]-1,pos[1]]);
                if (pos[0] == 6 && board[pos[0]-2] [pos[1]] === null) {
                    moves.push([pos[0]-2,pos[1]]);
                }
            }
            if (pos[1] -1 >= 0) {
                let piece = board[pos[0]-1][pos[1]-1];
                if (piece !== null && !same_team(piece)) {
                    moves.push([pos[0]-1, pos[1]-1]);
                }
            }
            if (pos[1] + 1 >= 0) {
                let piece = board[pos[0]-1][pos[1]+1];
                if (piece !== null && !same_team(piece)) {
                    moves.push([pos[0]-1, pos[1]+1]);
                }
            }
        }
    }
    else if (team == 'b') {
        if (pos[0]+1 >= 0) {
            // the square is in bound
            if (board[pos[0]+1][pos[1]] === null) {
                moves.push([pos[0]+1,pos[1]]);
                if (pos[0] == 6 && board[pos[0]+2] [pos[1]] === null) {
                    moves.push([pos[0]+2,pos[1]]);
                }
            }
            if (pos[1] -1 >= 0) {
                piece =board[pos[0]+1][pos[1]-1];
                if (piece !== null && !same_team(piece)) {
                    moves.push([pos[0]+1, pos[1]-1]);
                }
            }
            if (pos[1] + 1 >= 0) {
                piece =board[pos[0]+1][pos[1]+1];
                if (piece !== null && !same_team(piece)) {
                    moves.push([pos[0]+1, pos[1]+1]);
                }
            }
        }
    }
    return moves;
}
function king_moves(pos) {
    let all_moves = [
        [pos[0]-1, pos[1]-1], [pos[0]-1, pos[1]], [pos[0]-1, pos[1]+1],
        [pos[0], pos[1]-1], [pos[0], pos[1]+1],
        [pos[0]+1, pos[1]-1], [pos[0]+1, pos[1]], [pos[0]+1, pos[1]+1],
    ];
    // squares on the board only
    moves_on_board = all_moves.filter(coordinate => ((coordinate[0]*8)+coordinate[1]) >=0 && ((coordinate[0]*8)+coordinate[1])  < 63);
    // if the square belongs to a friendly piece, take the square out from the list
    moves1 = moves_on_board.filter(x => board[x[0]][x[1]] !== null && same_team(board[x[0]][x[1]][0]));
    moves2 = moves_on_board.filter(x => !moves1.includes(x));
    return moves2;
}

function knight_moves(pos) {
    let all_moves = [
        [pos[0]-2, pos[1]-1], [pos[0]-2, pos[1]+1], 
        [pos[0]+2, pos[1]-1], [pos[0]+2, pos[1]+1], 
        [pos[0]-1, pos[1]+2], [pos[0]+1, pos[1]+2], 
        [pos[0]-1, pos[1]-2], [pos[0]+1, pos[1]-2],
    ];
    filtered = all_moves.filter(ele => !(ele[0] < 0 || ele[0] > 7 || ele[1] < 0 || ele[1] > 7));
    blocked = filtered.filter(ele => board[ele[0]][ele[1]] !== null && same_team(board[ele[0]][ele[1]][0]));
    return filtered.filter(ele => !blocked.includes(ele));
}

function bishop_moves(pos) {
    let diagonal = diagonal_squares(pos);
    let occupied = diagonal.filter(ele => board[ele[0]][ele[1]] !== null);
    let blocked = [];
    for (let i = 0; i < occupied.length; i++) {
        let square = occupied[i];
        let x = square[0];
        let y = square[1];
        if (x < pos[0] && y > pos[1]) {
            blocked= [...new Set(blocked.concat(diagonal.filter(ele => ele[0] < x && ele[1] > y)))];
            if (same_team(board[x][y][0])) blocked.push(square);
        }
        if (x < pos[0] && y < pos[1]) {
            blocked= [...new Set(blocked.concat(diagonal.filter(ele => ele[0] < x && ele[1] < y)))];
            if (same_team(board[x][y][0])) blocked.push(square);
        }
        if (x > pos[0] && y < pos[1]) {
            blocked= [...new Set(blocked.concat(diagonal.filter(ele => ele[0] > x && ele[1] < y)))];
            if (same_team(board[x][y][0])) blocked.push(square);
        }
        if (x > pos[0] && y > pos[1]) {
            blocked= [...new Set(blocked.concat(diagonal.filter(ele => ele[0] > x && ele[1] > y)))];
            if (same_team(board[x][y][0])) blocked.push(square);
        }
    }
    return diagonal.filter(ele => !blocked.includes(ele));
}

function rook_moves(pos) {
    let column_moves = column(pos).filter(ele => !(ele[0] == pos[0] && ele[1]==pos[1]));
    let row_moves = row(pos).filter(ele => !(ele[0] == pos[0] && ele[1]==pos[1]));
    let orthogonal_squares_without_ownpos = column_moves.concat(row_moves);
    // find blocking squares
    let occupied_squares = orthogonal_squares_without_ownpos.filter(ele => board[ele[0]][ele[1]] !== null);
    for (let occupied of occupied_squares) {
        if (occupied[1] === pos[1]) {
            //same column 
            if (occupied[0] < pos[0]){
                //above the piece position, filter all squares above the occupied
                if (!same_team(board[occupied[0]][occupied[1]][0])) {
                    column_moves = column_moves.filter(ele => (ele[1] === pos[1] && ele[0] >= occupied[0]));
                }
                else {
                    column_moves = column_moves.filter(ele => (ele[1] === pos[1] && ele[0] > occupied[0]));
                }
            }
            if (occupied[0] > pos[0]){
                //below the piece position, filter all squares below the occupied
                if (!same_team(board[occupied[0]][occupied[1]][0])) {
                    column_moves = column_moves.filter(ele => (ele[1] === pos[1] && ele[0] <= occupied[0]));
                } else {
                    column_moves = column_moves.filter(ele => (ele[1] === pos[1] && ele[0] < occupied[0]));
                }
            }
        }
        else if (occupied[0] === pos[0]) {
            //same row 
            if (occupied[1] < pos[1]){
                //left of the piece position, filter all squares left the occupied
                if (!same_team(board[occupied[0]][occupied[1]][0])) {
                    row_moves = row_moves.filter(ele => (ele[0] === pos[0] && ele[1] >= occupied[1]));
                } else {
                    row_moves = row_moves.filter(ele => (ele[0] === pos[0] && ele[1] > occupied[1]));
                }
            }
            if (occupied[1] > pos[1]){
                //right of the piece position, filter all squares right the occupied
                if (!same_team(board[occupied[0]][occupied[1]][0])) {
                    row_moves = row_moves.filter(ele => (ele[0] === pos[0] && ele[1] <= occupied[1]));
                } else {
                    row_moves = row_moves.filter(ele => (ele[0] === pos[0] && ele[1] < occupied[1]));
                }
            }
        }
    }
    return column_moves.concat(row_moves);
}


function same_team(piece) {
    if (team == 'w') return piece == piece.toUpperCase();
    else if (team='b') return piece == piece.toLowerCase();
}
function column (pos) {
    // given the position return the column coordinates
    let column = [];
    for (let i = 0; i < 8; i++){
        column.push([i, pos[1]]);
    }
    return column;
}
function row(pos) {
    let row = [];
    for (let i = 0; i < 8; i++){
        row.push([pos[0],i]);
    }
    return row;
}

function diagonal_squares(pos) {
    // depending on the position returns the diagonal squares within the board
    // pos is an array of [x.y]
    let moves = [];
    for (let i = 0; i < 64; i++) {
        // if x distance and y distance are the same it is a diagonal square
        let x = Math.floor(i/8);
        let y = i%8;
        if (Math.abs(pos[0]-x) == Math.abs(pos[1]-y)) {
            moves.push([x,y]);
        }
    }
    return moves.filter(ele => ele[0] != pos[0] && ele[1] != pos[1]);
}

function movehighlight() {
    $('#highlight').removeAttr('id','highlight');
    $('#board tr td').eq(highlight).attr('id','highlight');
}
$(() => {
    $('#btn').click(function() {
        sock.emit('game create', sock.id);
    })
    $('#joinbtn').click(function() {
        sock.emit('game join', sock.id);
    })
    // draw the board with given board array
    draw_board(board);
    sock.on('board update', (fen) => draw_board(FENtoBoard(fen)));
    sock.on('game created', (game)=> {
        if(game['black'] == sock.id) {
            team = 'b';
            console.log(team);
        }
        else if (game['white'] == sock.id) {
            team = 'w';
            console.log(team);
        }
        else console.log('You are not assigned');
    })

    $(document).keydown(e => keydownEvent(e));
}
)