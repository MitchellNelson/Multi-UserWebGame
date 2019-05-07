let gameScene = new Phaser.Scene('Game');

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "snakeGame",
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


/* TODO:
	teleport tail back to one in front if gets too far away
*/
var player;
var dot;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var snekIsAlive = true;

var prevDifficulty = 1
var prevKey = 0;
var snake = [];

var game = new Phaser.Game(config);


var app;

function init()
{
	app = new Vue({
		el: "#app",
		data: {
			difficulty: 1,
			difficulties: ["Mobile Gamer", "Console Gamer", "PC gamer", "Apex Gamer"],
			diffSpeeds: [150, 250, 500, 800] 
		}
	});
}
function changeDifficulty(newDiff)
{
	app.difficulty = newDiff;
}

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/grass.jpg');
    this.load.image('star', 'assets/apple.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('tail', 'assets/caterpillarbody.png');
    this.load.spritesheet('caterpillar', 'assets/caterpillarhead.png', { frameWidth: 32, frameHeight: 48 });
}

function create ()
{
    this.add.image(400, 300, 'ground').setScale(2.7,2.5);

    //set worldbounds to ground area
    let bounds = this.physics.world.setBounds(30, 32, 740, 536, true, true, true, true);

	player = this.physics.add.sprite(100, 450, 'caterpillar');
	player.changeLocationX=null;
	player.changeLocationY=null;
    player.setCollideWorldBounds(true);
	player.onWorldBounds = true;

	snake.push(player);

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  The score
    scoreText = this.add.text(20, 5, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });
	
	dot = this.physics.add.image(400, 300, 'star');
	this.physics.add.overlap(player, dot, player_collide_dot, null, this);	

	//this.physics.add.overlap(player, bounds, player_collide_enemy, null, this);
}
function update()
{	
	//reset game when difficulty changed
	if(prevDifficulty != app.difficulty)
	{
		prevDifficulty = app.difficulty;

		// restart game
		this.time.delayedCall(1, function() {
			this.registry.destroy();
			this.events.off();
			this.scene.restart();
			resetGame();
		}, [], this);
	}

	if(!snekIsAlive)
	{	
		return;
	}
	follow();
	track_movements();
	if(dot == null){
		dot = this.physics.add.image((Math.random() * 708) + 30, (Math.random() * 500) + 32, 'star');
		this.physics.add.overlap(player, dot, player_collide_dot, null, this);
	}
}
function follow(){
	//update tail positions
	for(var i = 0; i < snake.length; ++i)
	{
		//snake[i].body.velocity.prevx = snake[i].body.velocity.x;
		//snake[i].body.velocity.prevy = snake[i].body.velocity.y;
		console.log();
		snake[i].body.prevVelocity = snake[i].body.velocity;
		if(i != 0)
		{
			var is_closeX = snake[i].body.velocity.y == 0 && snake[i].x <= (snake[i-1].changeLocationX+5) && snake[i].x >= (snake[i-1].changeLocationX-5); 
			
			var is_closeY = snake[i].body.velocity.x == 0 && snake[i].y <= (snake[i-1].changeLocationY+5) && snake[i].y >= (snake[i-1].changeLocationY-5); 
			if(is_closeX){
				console.log("Tail changing X velocity")

				snake[i].y = snake[i-1].y+getYPadding(snake[i-1]);;
				snake[i].x = snake[i-1].x;
				snake[i].body.setVelocityX(snake[i-1].body.prevVelocity.x);
				snake[i].body.setVelocityY(snake[i-1].body.prevVelocity.y);

				snake[i].changeLocationX = snake[i].x;
				snake[i].changeLocationY = snake[i].y;		
				snake[i-1].changeLocationX = null;
				snake[i-1].changeLocationY = null;
			}
			if(is_closeY){
				console.log("Tail changing Y velocity")

				snake[i].x = snake[i-1].x+getXPadding(snake[i-1]);
				snake[i].y = snake[i-1].y;
				snake[i].body.setVelocityX(snake[i-1].body.prevVelocity.x);
				snake[i].body.setVelocityY(snake[i-1].body.prevVelocity.y);

				snake[i].changeLocationX = snake[i].x;
				snake[i].changeLocationY = snake[i].y;		
				snake[i-1].changeLocationX = null;
				snake[i-1].changeLocationY = null;
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

	newtail = this.physics.add.sprite(leaderx+getXPadding(snake[snake.length-1]), leadery+getYPadding(snake[snake.length-1]), 'tail');

	this.physics.add.overlap(player, newtail, player_collide_enemy, null, this);

	//set velocity of newtail to the velocity of the previous tail
	newtail.setVelocityX(snake[snake.length-1].body.velocity.x);
	newtail.setVelocityY(snake[snake.length-1].body.velocity.y);

	snake.push(newtail);
}
function player_collide_enemy()
{	
	if(!snekIsAlive){return;}

	gameOver = true;
	snekIsAlive = false;
	console.log("game over");

	// shake the camera
	this.cameras.main.shake(500);

	//fade camera
	this.time.delayedCall(250, function() {
    	this.cameras.main.fade(350);
	}, [], this);

	for(var i = 0; i < snake.length; ++i)
	{
		snake[i].destroy();
	}

	// restart game
	this.time.delayedCall(600, function() {
		this.registry.destroy();
		this.events.off();
		this.scene.restart();
		resetGame();
	}, [], this);
}
function resetGame()
{
	console.log("resetting game");
	snake = [];
	score = 0;

	gameOver = false;
	snekIsAlive = true;
}
function track_movements(){
	if (gameOver)
    {
        return;
    }
	var changed_velocity = false;
	var speed = app.diffSpeeds[app.difficulty];

	if(snake.length==1){//only head
		player.changeLocationX =null;
		player.changeLocationY = null;	
	}
	if(player.changeLocationX == null && player.changeLocationY ==null){

		if (prevKey != 1 && cursors.left.isDown && player.body.velocity.x == 0)
		{
			prevKey = 1;
			changed_velocity=true;	
			player.setVelocityX(speed * -1);
			player.setVelocityY(0);

		}
		else if (prevKey != 2 && cursors.right.isDown && player.body.velocity.x ==0)
		{
			prevKey = 2;
			changed_velocity=true;
			player.setVelocityX(speed);
			player.setVelocityY(0);
		}
		else if (prevKey != 3 && cursors.up.isDown && player.body.velocity.y ==0)
		{
			prevKey = 3;
			changed_velocity=true;
			player.setVelocityY(speed * -1);
			player.setVelocityX(0);
		}   
		else if (prevKey != 4 && cursors.down.isDown && player.body.velocity.y ==0)
		{
			prevKey = 4;
			changed_velocity=true;
			player.setVelocityY(speed);
			player.setVelocityX(0);
		}
		if(!gameOver && changed_velocity){
			player.changeLocationX = player.x;
			player.changeLocationY = player.y;		
			//console.log("Changed Velocity | X: "+ player.changeLocationX + ", Y: "+ player.changeLocationY);
		}
	}
}
