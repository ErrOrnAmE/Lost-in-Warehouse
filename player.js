
var Player = function(sprite) {
	this.sprite = sprite;
};

Player.preload = function() {

	/* Load spritesheet */
	game.load.spritesheet('robot','assets/sprites/robot.png',120,105,4);

};

Player.create = function() {

	/* Create the player object */
	game.player = new Player(game.add.isoSprite(134,134, 0, 'robot', 0, game.groups['main-layer']));
	game.player.sprite.anchor.set(0.5, 1.0);
	game.player.coord = {x: 2, y: 2};
	game.player.keys_down = [0,0,0,0,0];

	/* Make Phaser capture the keys */
	game.input.keyboard.addKeyCapture([
		Phaser.Keyboard.LEFT,
		Phaser.Keyboard.RIGHT,
		Phaser.Keyboard.UP,
		Phaser.Keyboard.DOWN,
		Phaser.Keyboard.SPACEBAR
	]);

	/* Add callbacks for key up and down */
	game.input.keyboard.onDownCallback = function(event) {
		game.player.registerKeyDown(event.keyCode);

		// if direction key
		if (event.keyCode >= 37 && event.keyCode <= 40) {
			if (!game.player.isMoving) {
				game.player.move();
			}
		}
	};

	game.input.keyboard.onUpCallback = function(event) {
		game.player.registerKeyUp(event.keyCode);
	};

	/* Make the camera follow the player */
	game.camera.follow(game.player.sprite);

};

Player.update = function() {

};

Player.render = function() {

	game.debug.text(game.player.coord.x+':'+game.player.coord.y+":"+game.player.sprite.z, 2, 28, "#a7aebe");

};

Player.directionToCoord = function(direction) {

	// Translate direction to x & y
	var x = direction == 1 ? -1 : ( direction == 3 ? 1 : 0 );
	var y = direction == 2 ? -1 : ( direction == 0 ? 1 : 0 );

	return {x: x, y: y};

};

// Prototypes

Player.prototype.move = function() {

	var lastDirection = this.lastDirectionDown();

	// Change the sprite orientation
	this.sprite.frame = lastDirection;

	if (this.canMove()) {

		this.isMoving = true;

		this.untrigger();

		// Make the coord change
		var coord = Player.directionToCoord(lastDirection);
		this.coord.x += coord.x;
		this.coord.y += coord.y;

		// Add a sliding effect
		var tween = game.add.tween(this.sprite).to({isoX: this.coord.x * game.map_info.tile.width, isoY: this.coord.y * game.map_info.tile.height}, 200, Phaser.Easing.Linear.None, true, 0, 0, false);
		
		tween.onComplete.add(function() {

				this.trigger();

				this.move();
			},this);

	} else {
		this.isMoving = false;
	}

};

Player.prototype.canMove = function() {

	var key = this.lastDirectionDown();

	// No key currently down
	if (key == -1)
		return false;

	var coord = Player.directionToCoord(key);

	coord.x += this.coord.x;
	coord.y += this.coord.y;

	if (coord.x < 0) {
		return false;
	} else if (coord.x > game.map.width-1) {
		return false;
	}

	if (coord.y < 0) {
		return false;
	} else if (coord.y > game.map.height-1) {
		return false;
	}

	var floor_tile = game.map.layers.floor.tiles[coord.x];

	if (floor_tile == undefined || floor_tile[coord.y] == undefined) {
		return false;
	}

	var obstacle_tile = game.map.layers.obstacle.tiles[coord.x];

	if (obstacle_tile != undefined && obstacle_tile[coord.y] != undefined) {
		return false;
	}

	return true;

};

Player.prototype.lastDirectionDown = function() {

	// Get last key down
	for (var i = 0; i < 4; i++) {
		if (this.keys_down[i] == 2) {
			return i;
		}
	}
	// If we don't know, take the first one currently down
	for (var i = 0; i < 4; i++) {
		if (this.keys_down[i] == 1) {
			return i;
		}
	}
	return -1;

};

Player.prototype.registerKeyDown = function(keyCode) {

	// if direction key
	if (keyCode >= 37 && keyCode <= 40) {
		// The last direction down is set to 2
		for (var i = 0; i < 4; i++) {
			if (this.keys_down[i] == 2) {
				this.keys_down[i] = 1;
			}
		}
		this.keys_down[keyCode-37] = 2; // -37 because directions start at 37
	}
	// if ctrl key
	else if (keyCode == 17) {
		this.keys_down[4] = 1;
	}

};

Player.prototype.registerKeyUp = function(keyCode) {

	// if direction key
	if (keyCode >= 37 && keyCode <= 40) {
		this.keys_down[keyCode-37] = 0;
	}
	// if ctrl key
	else if (keyCode == 17) {
		this.keys_down[4] = 0;
	}

};

Player.prototype.trigger = function() {
	var trigger_tile = game.map.layers.trigger.tiles[this.coord.x];

	if (trigger_tile != undefined && trigger_tile[this.coord.y] != undefined) {
		trigger_tile = trigger_tile[this.coord.y];

		if (!trigger_tile.triggered) {
			if (trigger_tile.type == "multiple") {
				this.tile_triggered = trigger_tile;
			}
			
			trigger_tile.trigger();
		}
	}
};

Player.prototype.untrigger = function() {
	if (this.tile_triggered != undefined) {
		this.tile_triggered.untrigger();
		this.tile_triggered = undefined;
	}
};