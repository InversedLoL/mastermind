((exports) => {
    /*
     * Client to server: game is complete, the winner is ...
     */
    exports.T_GAME_WON_BY = "GAME-WON-BY";
    exports.O_GAME_WON_BY = {
        type: exports.T_GAME_WON_BY,
        data: null
    };

    /*
     * Server to client: abort game (e.g. if codebreaker exited the game)
     */
    exports.O_GAME_ABORTED = {
        type: "GAME-ABORTED"
    };
    exports.S_GAME_ABORTED = JSON.stringify(exports.O_GAME_ABORTED);

    /*
     * Server to Mastermind: choose code
     */
    exports.O_CHOOSE = { type: "CHOOSE-CODE" };
    exports.S_CHOOSE = JSON.stringify(exports.O_CHOOSE);

    /*
     * Server to client: set as mastermind
     */
    exports.T_PLAYER_TYPE = "PLAYER-TYPE";
    exports.O_MASTERMIND = {
        type: exports.T_PLAYER_TYPE,
        data: "MASTERMIND"
    };
    exports.S_MASTERMIND = JSON.stringify(exports.O_MASTERMIND);

    /*
     * Server to client: set as codebreaker
     */
    exports.O_CODEBREAKER = {
        type: exports.T_PLAYER_TYPE,
        data: "CODEBREAKER"
    };
    exports.S_CODEBREAKER = JSON.stringify(exports.O_CODEBREAKER);

    /*
     * Mastermind to server OR server to Codebreaker: this is the code
     */
    exports.T_CODE = "SET-CODE";
    exports.O_CODE = {
        type: exports.T_CODE,
        data: null
    };
    //exports.S_CODE does not exist, as we always need to fill the data property

    /*
     * Codebreaker to server OR server to Mastermind: guessed code
     */
    exports.T_CODE_GUESS = "CODE-GUESS";
    exports.O_CODE_GUESS = {
        type: exports.T_CODE_GUESS,
        data: null
    };
    //exports.S_CODE_GUESS does not exist, as data needs to be set
})(typeof exports === "undefined" ? (this.Messages = {}) : exports);
