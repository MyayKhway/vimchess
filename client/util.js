function FENtoBoard (fen) {
    let ranks = fen.split('/');
    let board = [];
    for(let k = 0; k < ranks.length; k++) {
        let arr = [];
        let rank = ranks[k];
        for (let i = 0; i < rank.length; i++) {
            if (rank[i] >='0' && rank[i] <= '9') {
                for (let j = 0; j < rank[i]; j++) {
                    arr.push(null);
                }
            }else arr.push(rank[i]);
        }board.push(arr);
    }
    return board;
}

function boardtoFEN (board) {
    let fen = '';
    for (let i = 0; i < board.length; i++) {
        let rank = board[i];
        let null_count = 0;
        for (let j = 0; j < rank.length; j++) {
            if (rank[j]!=null) {
                if (null_count > 0) {
                    fen = fen + null_count.toString();
                    null_count = 0;
                    fen = fen + rank[j];
                } else fen = fen + rank[j];
            }
            else {
                null_count = null_count + 1;
            }
        }
        if (null_count>0) fen = fen + null_count.toString();
        fen = fen + '/';
        null_count = 0;
    }
    return fen;
}
export {boardtoFEN, FENtoBoard};