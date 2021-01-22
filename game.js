var game = function (gameID) {
    this.mastermind = null;
    this.codebreaker = null;
    this.id = gameID;
    this.codeToBreak = null;
    this.lastGuess = null;
    this.gameState = "0 JOINT";
};

game.prototype.transitionStates = {};
game.prototype.transitionStates["0 JOINT"] = 0;
game.prototype.transitionStates["1 JOINT"] = 1;
game.prototype.transitionStates["2 JOINT"] = 2;
game.prototype.transitionStates["CODE GUESSED"] = 3;
game.prototype.transitionStates["MASTERMIND"] = 4; // Mastermind won
game.prototype.transitionStates["CODEBREAKER"] = 5; // Codebreaker won
game.prototype.transitionStates["ABORTED"] = 6;

game.prototype.transitionMatrix = [
    [0, 1, 0, 0, 0, 0, 0], // 0 JOINT
    [1, 0, 1, 0, 0, 0, 0], // 1 JOINT
    [0, 0, 0, 1, 0, 0, 1], // 2 JOINT (note: once we have two players, there is no way back!)
    [0, 0, 0, 1, 1, 1, 1], // CODE GUESSED
    [0, 0, 0, 0, 0, 0, 0], // A WON
    [0, 0, 0, 0, 0, 0, 0], // B WON
    [0, 0, 0, 0, 0, 0, 0] // ABORTED
];

game.prototype.isValidTransition = function (from, to) {
    console.assert(
        typeof from == "string",
        `${arguments.callee.name}: Expecting a string, got a ${typeof from}`
    );
    console.assert(
        typeof to == "string",
        `${arguments.callee.name}: Expecting a string, got a ${typeof to}`
    );
    console.assert(
        from in game.prototype.transitionStates == true,
        `${arguments.callee.name}: Expecting ${from} to be a valid transition state`
    );
    console.assert(
        to in game.prototype.transitionStates == true,
        `${arguments.callee.name}: Expecting ${to} to be a valid transition state`
    );

    let i, j;
    if (!(from in game.prototype.transitionStates)) {
        return false;
    } else {
        i = game.prototype.transitionStates[from];
    }

    if (!(to in game.prototype.transitionStates)) {
        return false;
    } else {
        j = game.prototype.transitionStates[to];
    }

    return game.prototype.transitionMatrix[i][j] > 0;
};

game.prototype.isValidState = function (s) {
    return s in game.prototype.transitionStates;
};

game.prototype.setState = function (w) {
    console.assert(
        typeof w == "string",
        `${arguments.callee.name}: Expecting a string, got a ${typeof w}`
    );

    if (
        game.prototype.isValidState(w) &&
        game.prototype.isValidTransition(this.gameState, w)
    ) {
        this.gameState = w;
        console.log(`[STATE] ${this.gameState}`);
    } else {
        return new Error(`Impossible status change from ${this.gameState} to ${w}`);
    }
};

game.prototype.setCode = function (c) {
    console.assert(
        c instanceof Array,
        `${arguments.callee.name}: Expecting an osbject, got a ${typeof c}`
    );

    // Two possible options for the current game state:
    // 1 JOINT, 2 JOINT
    if (this.gameState != "1 JOINT" && this.gameState != "2 JOINT") {
        return new Error(`Trying to set code, but game state is ${this.gameState}`);
    }
    console.log(`Code: ${c.join(", ")}`);
    this.codeToBreak = c;
};

game.prototype.getCode = function () {
    return this.codeToBreak;
};

game.prototype.setGuess = function (c) {
    console.assert(
        c instanceof Object,
        `${arguments.callee.name}: Expecting an osbject, got a ${typeof c}`
    );
    if (this.gameState != "CODE GUESSED") {
        return new Error(`Trying to set guess, but game state is ${this.gameState}`);
    }
    console.log(`Guess: ${c.join(", ")}`);
    this.lastGuess = c;
};

game.prototype.getGuess = function () {
    return this.lastGuess;
};

game.prototype.hasTwoPlayersConnected = function () {
    return this.gameState == "2 JOINT";
};

game.prototype.addPlayer = function (p) {
    console.assert(
        p instanceof Object,
        `${arguments.callee.name}: Expecting an object (WebSocket), got a ${typeof p}`
    );

    if (this.gameState != "0 JOINT" && this.gameState != "1 JOINT") {
        return new Error(`Invalid call to addPlayer, current state is ${this.gameState}`);
    }

    let error = this.setState("1 JOINT");
    if (error instanceof Error) {
        this.setState("2 JOINT");
    }

    if (this.mastermind == null) {
        this.mastermind = p;
        return "MASTERMIND";
    } else {
        this.codebreaker = p;
        return "CODEBREAKER";
    }
};

module.exports = game;
