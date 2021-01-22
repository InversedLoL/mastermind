var express = require("express");
var http = require("http");
var websocket = require("ws");

// Utility
var router = require("./routes/index");
var messages = require("./public/scripts/messages");

// Game constants
var gameStats = require('./statistics');
var Game = require('./game');

// Server constants
var port = process.argv[2];
var app = express();

app.set("view engine", "ejs");
app.use(express.static(`${__dirname}/public`));

app.get("/play", router);
app.get("/splash", router);
app.get("/", router);

var server = http.createServer(app);
const wss = new websocket.Server({ server });

var websockets = {};

setInterval(function () {
    for (let socket in websockets) {
        if (Object.prototype.hasOwnProperty.call(websockets, socket)) {
            let game = websockets[socket];

            if (game.finalStatus != null) {
                delete websockets[socket];
            }
        }
    }
}, 50000);

var currentGame = new Game(gameStats.gamesInitialized++);
var connectionID = 0;

wss.on("connection", function connection(ws) {
    let con = ws;
    con.id = connectionID++;
    let playerType = currentGame.addPlayer(con);
    websockets[con.id] = currentGame;

    console.log(`Player ${con.id} joined game ${currentGame.id} as ${playerType}`);
    con.send(playerType == "MASTERMIND" ? messages.S_MASTERMIND : messages.S_CODEBREAKER);

    if (playerType == "CODEBREAKER" && currentGame.getCode() != null) {
        let msg = messages.O_CODE;
        msg.data = currentGame.getCode();
        con.send(JSON.stringify(msg));
    }

    if (currentGame.hasTwoPlayersConnected()) {
        currentGame = new Game(gameStats.gamesInitialized++);
    }

    con.on("message", function incoming(message) {
        var oMsg = JSON.parse(message);

        var game = websockets[con.id];
        var isMastermind = (game.mastermind == con) ? true : false;

        if (isMastermind) {
            if (oMsg.type == messages.T_CODE && oMsg.data != null) {
                game.setCode(oMsg.data);
            }

            if (game.hasTwoPlayersConnected()) {
                game.codebreaker.send(message);
            }
        } else {
            if (oMsg.type == messages.T_CODE_GUESS) {
                game.setGuess(oMsg.data);
                game.mastermind.send(message)
            }

            if (oMsg.type == messages.T_GAME_WON_BY) {
                game.setState(oMsg.data);
                game.mastermind.send(message)
                gameStats.gamesPlayed++;
            }
        }
    });

    con.on("close", function (code) {
        console.log(`${con.id} disconnected`);

        if (code == 1001) {
            const game = websockets[con.id];

            if (game.isValidTransition(game.gameState, "ABORTED")) {
                game.setState("ABORTED");
                gameStats.gamesAborted++;

                try {
                    game.mastermind.close();
                    game.mastermind = null;
                } catch (e) {
                    console.log(`Mastermind closing: ${e}`);
                }

                try {
                    game.codebreaker.close();
                    game.codebreaker = null;
                } catch (e) {
                    console.log(`Codebreaker closing: ${e}`);
                }
            }
        }
    });
});

server.listen(port);
