/**
 * Created by marco on 10.02.17.
 */





window.onload = function () {

    var game = new Phaser.Game(800, 600, Phaser.AUTO, '', {preload: preload, create: create, update: update});

    var socket = io("http://localhost:3000");
    var syncIt = new SyncIt(socket);

    var key1;
    var key2;
    var key3;
    var key4;
    var up;
    var left;
    var down;
    var right;

    var gameState;

    var playerGraphics = [];

    var playerIndex = 0;

    function preload() {
        // run in background
        game.stage.disableVisibilityChange = true;
    }

    function create() {

        // set up keys

        key4 = game.input.keyboard.addKey(Phaser.Keyboard.W);
        key4.onDown.add(moveUp, this);

        key1 = game.input.keyboard.addKey(Phaser.Keyboard.A);
        key1.onDown.add(moveLeft, this);

        key2 = game.input.keyboard.addKey(Phaser.Keyboard.S);
        key2.onDown.add(moveDown, this);

        key3 = game.input.keyboard.addKey(Phaser.Keyboard.D);
        key3.onDown.add(moveRight, this);


    }

    function moveLeft() {
        console.log(syncIt.getObject("game_state"));
        gameState.players[playerIndex].x --;
    }

    function moveRight() {
        gameState.players[playerIndex].x ++;
    }

    function moveUp() {
        down = false;
        up = true;
    }

    function moveDown() {
        up = false;
        down = true;
    }

    function update() {

        if (up) {
            gameState.players[playerIndex].y++;
        }
        if (down) {
            gameState.players[playerIndex].y--;
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

        if (!gameState && syncIt.getObject("game_state")) {
            gameState = syncIt.getObject("game_state");

            // add new player
            playerIndex = gameState.players.length;
            gameState.players.push({id: playerIndex, x: 10, y: 10});
        }
    }
};