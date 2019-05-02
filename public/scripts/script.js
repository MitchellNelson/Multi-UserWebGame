var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var tail;
var player;
var dot;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var snake = [];

var game = new Phaser.Game(config);
function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/bomb.png', { frameWidth: 32, frameHeight: 48 });
}

function create ()
{
    this.add.image(400, 300, 'sky');

	player = this.physics.add.sprite(100, 450, 'dude');

	player.turnLocations = [];

    player.setCollideWorldBounds(true);
	player.onWorldBounds = true;
	snake.push(player);
    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  The score
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
	
	dot = this.physics.add.image(400, 300, 'star');
	this.physics.add.overlap(player, dot, player_collide_dot, null, this);
	
}
function update ()
{
	track_movements();
	if(dot == null){
		dot = this.physics.add.image(Math.floor(Math.random() * 13) * 64, Math.floor(Math.random() * 10) * 64, 'star');
		this.physics.add.overlap(player, dot, player_collide_dot, null, this);
	}
	//update tail positions
	for(var i = 0; i < snake.length; ++i)
	{
		//snake[i].body.velocity.prevx = snake[i].body.velocity.x;
		//snake[i].body.velocity.prevy = snake[i].body.velocity.y;
		snake[i].body.prevVelocity = snake[i].body.velocity;		
		if(i != 0)
		{
			var is_closeX = false;
			var is_closeY = false;

			if(snake[i-1].turnLocations.length > 0)
			{
				var is_closeX = snake[i].body.velocity.y == 0 && snake[i].x <= (snake[i-1].turnLocations[0].x+3) && snake[i].x >= (snake[i-1].turnLocations[0].x-3); 
				console.log("snake i-1 x: " + snake[i-1].turnLocations[0].x);
				var is_closeY = snake[i].body.velocity.x == 0 &&  snake[i].y <= (snake[i-1].turnLocations[0].y+3) && snake[i].y >= (snake[i-1].turnLocations[0].y-3); 
			}

			if(is_closeX){
				console.log("Tail changing X velocity")

				snake[i].y = snake[i-1].y+getYPadding(snake[i-1]);;
				snake[i].x = snake[i-1].x;

				snake[i].body.setVelocityX(snake[i-1].turnLocations[0].velocityX);
				snake[i].body.setVelocityY(snake[i-1].turnLocations[0].velocityY);

				//snake[i].setVelocityY(snake[i-1].body.velocity.prevy);
				//snake[i].setVelocityX(0);

				//set changed location for the next element

				snake[i].turnLocations.push({"x": snake[i].x, "y": snake[i].y, "velocityX": snake[i].body.velocity.x, "velocityY": snake[i].body.velocity.y});
				snake[i-1].turnLocations = snake[i-1].turnLocations.slice(1);

				console.log(snake[i].turnLocations[0].velocityX);
/*

				snake[i].changeLocationX = snake[i].x;
				snake[i].changeLocationY = snake[i].y;		
				snake[i-1].changeLocationX = null;
				snake[i-1].changeLocationY = null;
*/
			}
			if(is_closeY){
				console.log("Tail changing Y velocity")

				snake[i].x = snake[i-1].x+getXPadding(snake[i-1]);
				snake[i].y = snake[i-1].y;
				snake[i].body.setVelocityX(snake[i-1].turnLocations[0].velocityX);
				snake[i].body.setVelocityY(snake[i-1].turnLocations[0].velocityY);

			//	snake[i].setVelocityX(snake[i-1].body.velocity.prevx);
			//	snake[i].setVelocityY(0);

				//set changed location for the next element
				snake[i].turnLocations.push({"x": snake[i].x, "y": snake[i].y, "velocityX": snake[i].body.velocity.x, "velocityY": snake[i].body.velocity.y});
				snake[i-1].turnLocations = snake[i-1].turnLocations.slice(1);

				console.log(snake[i].turnLocations[0].velocityX);
/*
				snake[i].changeLocationX = snake[i].x;
				snake[i].changeLocationY = snake[i].y;		
				snake[i-1].changeLocationX = null;
				snake[i-1].changeLocationY = null;
*/
			}
		}
	}
}
function getYPadding(snake_element){
	if(snake_element.body.velocity.y<0){
		return 40;
	}
	else if(snake_element.body.velocity.y>0){
		return -40;
	}
	else{
		return 0;
	}
}
function getXPadding(snake_element){
	if(snake_element.body.velocity.x<0){
		return 40;
	}
	else if(snake_element.body.velocity.x>0){
		return -40;
	}
	else{
		return 0;
	}
}
function player_collide_dot(){
	dot.destroy();
	dot = null;
	score += 1;
	scoreText.setText('Score: ' + score);
	console.log("collision with apple");

	//coordinates of the prev tail
	leaderx = snake[snake.length-1].x;
	leadery = snake[snake.length-1].y;

	newtail = this.physics.add.sprite(leaderx+getXPadding(snake[snake.length-1]), leadery+getYPadding(snake[snake.length-1]), 'star');

	//set velocity of newtail to the velocity of the previous tail
	newtail.setVelocityX(snake[snake.length-1].body.velocity.x);
	newtail.setVelocityY(snake[snake.length-1].body.velocity.y);

	newtail.turnLocations = [];

	snake.push(newtail);
}
function track_movements(){
	//check if first movement
	var firstMove = false;
	if(player.body.velocity.x == 0 && player.body.velocity.y == 0)
	{
		firstMove = true;
	}

	if (gameOver)
    {
        return;
    }
	var changed_velocity = false;
	if (cursors.left.isDown && player.body.velocity.x != -180)
    {
		changed_velocity=true;	
		player.setVelocityX(-180);
		player.setVelocityY(0);
   	}
    else if (cursors.right.isDown && player.body.velocity.x != 180)
    {
		changed_velocity=true;
		player.setVelocityX(180);
		player.setVelocityY(0);
    }
	else if (cursors.up.isDown && player.body.velocity.y != -180)
    {
   		changed_velocity=true;
		player.setVelocityY(-180);
		player.setVelocityX(0);
    }   
	else if (cursors.down.isDown && player.body.velocity.y != 180)
    {
   		changed_velocity=true;
		player.setVelocityY(180);
		player.setVelocityX(0);
    }

	if(changed_velocity && !firstMove && snake.length > 1){

		player.turnLocations.push({"x": player.x, "y": player.y, "velocityX": player.body.velocity.x, "velocityY": player.body.velocity.y});

		var numOfTurns = player.turnLocations.length;
		/*
		player.changeLocationX = player.x;
		player.changeLocationY = player.y;
		*/
		console.log("Turns Queued: " + numOfTurns);
		console.log("Changed Velocity | X: " + player.turnLocations[numOfTurns-1].x + ", Y: " + player.turnLocations[numOfTurns-1].y)
	}

}
