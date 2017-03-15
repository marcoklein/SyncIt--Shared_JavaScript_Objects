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

    var players = [
        /*{
         name: "<NoName>",
         color: 0x000000,
         transparency: 1,
         radius: 0

         },*/
        {
            name: "player 1",
            color: 0x00FF00,
            transparency: 1,
            radius: 20,
            x: 100,
            y: 200,
            graphics: null // stores graphics object if existing
        }
    ];
        var graphics;

    function preload() {
        // run in background
        game.stage.disableVisibilityChange = true;
    }

    function create() {
        // graphics
        graphics = game.add.graphics(game.world.centerX, game.world.centerY);
        graphics.lineStyle(8, 0xffd900);

        graphics.drawEllipse(50, 50, 50, 50);

        // set up keys

        key4 = game.input.keyboard.addKey(Phaser.Keyboard.W);
        key4.onDown.add(moveUp, this);

        key1 = game.input.keyboard.addKey(Phaser.Keyboard.A);
        key1.onDown.add(moveLeft, this);

        key2 = game.input.keyboard.addKey(Phaser.Keyboard.S);
        key2.onDown.add(moveDown, this);

        key3 = game.input.keyboard.addKey(Phaser.Keyboard.D);
        key3.onDown.add(moveRight, this);


        /*players.forEach(function (player) {
            var graphics = game.add.graphics(player.x, player.y);


            // graphics.lineStyle(2, 0xffd900, 1);

            graphics.beginFill(player.color, player.transparency);
            graphics.drawCircle(player.x, player.y, player.radius * 2);
        });*/

    }

    function moveLeft() {
        console.log(syncIt.getObject("game_state"));
        syncIt.getObject("game_state").player.x--;
    }

    function moveRight() {
        syncIt.getObject("game_state").player.x++;
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
            syncIt.getObject("game_state").player.y++;
        }
        if (down) {
            syncIt.getObject("game_state").player.y--;
        }


        // var ellipse = new Phaser.Ellipse(100, 100, 200, 60);

        //  Our first arc will be a line only
        if (syncIt.getObject("game_state").player) {
            //console.log(JSON.stringify())
            graphics.x = syncIt.getObject("game_state").player.x;
            graphics.y = syncIt.getObject("game_state").player.y;
        }


        syncIt.syncNow();
    }
};