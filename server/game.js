function gameEnd(FEN) {
    FEN = FEN.replace(/\//g, '');
    FEN_lower = FEN.toLowerCase();
    FEN_upper = FEN.toUpperCase();
    return FEN == FEN_lower || FEN == FEN_upper;
}

function generateID() {
    return Math.random().toString(36).slice(2,-5)
}
module.exports = { gameEnd, generateID}
