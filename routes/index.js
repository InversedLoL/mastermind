const express = require("express");
const router = express.Router();

const gameStats = require("../statistics");

// Home page
router.get("/splash", function (req, res) {
    res.render("splash.ejs", {
        gamesPlayed: gameStats.gamesPlayed
    });
});

// Game page
router.get("/play", function (req, res) {
    res.sendFile("game.html", { root: "./public" });
});

// Home page shorthand
router.get("/", function (req, res) {
    res.render("splash.ejs", {
        gamesPlayed: gameStats.gamesPlayed
    });
});


module.exports = router;
