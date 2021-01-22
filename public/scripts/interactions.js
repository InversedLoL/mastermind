// Game constants
const colors = ["red", "green", "yellow", "blue", "purple", "aqua"];
const guessBtn = document.querySelector("#guessBtn");
const clearBtn = document.querySelector("#clearBtn");
const masterCode = document.querySelectorAll("#codemaker .code .circle");
const spawners = document.querySelectorAll("#spawners .circle");
const currentColor = document.querySelector("#chosen-color .circle");

// Game variables
let current = document.querySelector(".current");
let currentGuessCircles = document.querySelectorAll(".current .code .circle");
let currentFeedbackCricles = document.querySelectorAll(".current .feedback .circle");

class GameState {
    constructor(socket) {
        this.playerType = null;
        this.wrongGuesses = 0;
        this.guess = null;
        this.code = null;

        this.getPlayerType = () => {
            return this.playerType;
        };

        this.setPlayerType = (type) => {
            console.log(type);
            this.playerType = type;
        };

        this.setCode = (code) => {
            this.code = code;
        };

        this.incrWrongGuesses = () => {
            this.wrongGuesses++;

            const parent = document.querySelector(".current .code");
            for (let i in this.guess) {
                let replacement = document.createElement("span");
                replacement.classList.add("circle", this.guess[i]);
                parent.replaceChild(replacement, currentGuessCircles[i]);
            }

            const newCurrent = current.previousElementSibling;
            current.classList.remove("current");
            newCurrent.classList.add("current");
            current = newCurrent;
            currentGuessCircles = document.querySelectorAll(".current .code .circle");
            currentFeedbackCricles = document.querySelectorAll(".current .feedback .circle");

            currentGuessCircles.forEach((circle) => {
                circle.addEventListener("click", () => {
                    if (currentColor.classList.length > 1) {
                        circle.className = currentColor.className;
                    }
                });
            });
        };

        this.whoWon = () => {
            if (this.wrongGuesses > 10) {
                return "MASTERMIND";
            }

            if (this.guess != null && (this.guess.toString() == this.code.toString())) {
                return "CODEBREAKER";
            }

            return null;
        };

        this.revealCode = () => {
            for (let i = 0; i < masterCode.length; ++i) {
                masterCode[i].classList.add(this.code[i]);
            }
        };

        this.updateGame = (g) => {
            this.guess = g;
            let bulls = 0;
            let cows = 0;

            for (let cg in g) {
                for (let cc in this.code) {
                    if (g[cg] == this.code[cc]) {
                        if (cg == cc) bulls++;
                        else cows++;
                    }
                }
            }

            console.log(`Bulls: ${bulls}`);
            console.log(`Cows: ${cows}`);

            for (let i = 0; i < bulls; ++i) {
                currentFeedbackCricles[i].classList.add("bull");
            }

            for (let i = 0; i < cows; ++i) {
                currentFeedbackCricles[i + bulls].classList.add("cow");
            }

            if (bulls != 6) {
                this.incrWrongGuesses();
            } else {
                this.revealCode();
            }

            if (this.playerType == "CODEBREAKER") {
                let message = Messages.O_CODE_GUESS;
                message.data = g;
                socket.send(JSON.stringify(message));
            }

            let winner = this.whoWon();

            if (winner != null) {
                current.classList.remove("current");

                let alertMsg;
                if (winner == this.playerType) {
                    alertMsg = "Congratulations! You won!";
                } else {
                    alertMsg = "Condolences. You lost.";
                }

                window.alert(alertMsg);

                if (this.playerType == "CODEBREAKER") {
                    let finalMsg = Messages.O_GAME_WON_BY;
                    finalMsg.data = winner;
                    socket.send(JSON.stringify(finalMsg));
                }
                socket.close();
            }
        }
    }
}

// Setup
(function setup() {
    var socket = new WebSocket(Setup.WEB_SOCKET_URL);
    var gameState = new GameState(socket);

    socket.onmessage = (event) => {
        var incomingMsg = JSON.parse(event.data);

        // Set player
        if (incomingMsg.type == Messages.T_PLAYER_TYPE) {
            gameState.setPlayerType(incomingMsg.data);

            // Mastermind
            if (gameState.getPlayerType() == "MASTERMIND") {
                var promptString = "";
                var validCode = false;
                var code = null;

                while (!validCode) {
                    code = prompt(`${promptString}Colors: red, green, yellow, blue, purple, aqua\nPlease enter a 6 color code (separated by a space): `);

                    code = code.split(" ");

                    if (code.length != 6) {
                        promptString = "Code must be of 6 colors exactly!\n";
                    } else {
                        validCode = true;
                        for (let c in code) {
                            if (!(c in colors)) validCode = false;
                        }
                        if (!validCode) {
                            promptString = "Code must include only the give colors\n";
                        }
                    }
                }

                gameState.setCode(code);
                gameState.revealCode();

                var outgoingMsg = Messages.O_CODE;
                outgoingMsg.data = gameState.code;
                socket.send(JSON.stringify(outgoingMsg));
            } else { // Codebreaker
                window.alert("The Mastermind hasn't chosen a code, yet!");
            }
        }

        // Codebreaker: wait for code and start guessing...
        if (incomingMsg.type == Messages.T_CODE && gameState.getPlayerType() == "CODEBREAKER") {
            console.log(`Code: ${incomingMsg.data}`)
            gameState.setCode(incomingMsg.data);
            clearBtn.addEventListener("click", () => {
                currentGuessCircles.forEach((circle) => {
                    circle.className = "circle";
                });

                currentColor.className = "circle";
            });

            spawners.forEach((spawner) => {
                spawner.addEventListener("click", () => {
                    currentColor.className = spawner.className;
                });
            });

            currentGuessCircles.forEach((circle) => {
                circle.addEventListener("click", () => {
                    if (currentColor.classList.length > 1) {
                        circle.className = currentColor.className;
                    }
                });
            });

            guessBtn.addEventListener("click", () => {
                let complete = true;
                let guess = [];

                currentGuessCircles.forEach((circle) => {
                    if (circle.classList.length == 1) {
                        complete = false;
                        guess = [];
                    } else {
                        guess.push(circle.classList[1]);
                    }
                });

                if (complete) {
                    console.log(`Guess: ${guess.join(", ")}`);
                    gameState.updateGame(guess);
                }
            });

            document.querySelector("#abortBtn").addEventListener("click", function () {
                socket.close();
            })
        }

        // Mastermind: wait for guess and update board...
        if (incomingMsg.type == Messages.T_CODE_GUESS && gameState.getPlayerType() == "MASTERMIND") {
            gameState.updateGame(incomingMsg.data);
        }
    };

    socket.onopen = () => {

    }

    socket.onclose = () => {
        if (gameState.whoWon() == null) {
            window.alert("Game was aborted by the other player!");
        }
    };

    socket.onerror = function () { };
})();
