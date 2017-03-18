/**
 * Created by marco on 10.02.17.
 */





window.onload = function () {

    // init variables
    var game;
    var privateObject = {
        x: 100,
        y: 100
    };

    var keyUp;
    var keyLeft;
    var keyDown;
    var keyRight;
    var up;
    var left;
    var down;
    var right;

    var gameState;

    var playerGraphics = [];

    var playerIndex = 0;


    var socket = io();
    var syncIt = new SyncIt(socket);
    syncIt.setOnReadyListener(function () {
            console.log("SyncIt initialized.");

            game = new Phaser.Game(800, 600, Phaser.AUTO, '', {preload: preload, create: create, update: update});

            gameState = syncIt.globalSpace();


            // add new player
            playerIndex = gameState.players.length;
            gameState.players.push({id: playerIndex, x: 10, y: 10});
        });



    function preload() {
        // run in background
        game.stage.disableVisibilityChange = true;
    }

    function create() {

        // set up keys

        keyUp = game.input.keyboard.addKey(Phaser.Keyboard.W);
        keyUp.onDown.add(function() {up = true}, this);
        keyUp.onUp.add(function() {up = false}, this);

        keyLeft = game.input.keyboard.addKey(Phaser.Keyboard.A);
        keyLeft.onDown.add(function() {left = true}, this);
        keyLeft.onUp.add(function() {left = false}, this);

        keyDown = game.input.keyboard.addKey(Phaser.Keyboard.S);
        keyDown.onDown.add(function() {down = true}, this);
        keyDown.onUp.add(function() {down = false}, this);

        keyRight = game.input.keyboard.addKey(Phaser.Keyboard.D);
        keyRight.onDown.add(function() {right = true}, this);
        keyRight.onUp.add(function() {right = false}, this);


    }

    function update() {

        if (up) {
            gameState.players[playerIndex].y--;
        } else if (left) {
            gameState.players[playerIndex].x--;
        } else if (down) {
            gameState.players[playerIndex].y++;
        } else if (right) {
            gameState.players[playerIndex].x++;
        }


        //  Our first arc will be a line only
        if (gameState) {
            //console.log(JSON.stringify())
            for (var i = 0; i < gameState.players.length; i++) {
                if (!playerGraphics[i]) {
                    playerGraphics[i] = game.add.graphics(game.world.centerX, game.world.centerY);
                    playerGraphics[i].lineStyle(8, 0xffd900);

                    playerGraphics[i].drawCircle(50, 50, 25 * 2);
                }
                playerGraphics[i].x = gameState.players[i].x;
                playerGraphics[i].y = gameState.players[i].y;
            }
        }


        syncIt.syncNow();

    }
};