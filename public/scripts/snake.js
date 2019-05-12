var ws;
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
var player1;
var player2;
var dot;
var cursors;
var score1 = 0;
var score2 = 0;
var gameOver = false;
var scoreText;
var snekIsAlive = true;

var prevDifficulty = 1
var prevKey = 0;
var snake1 = [];
var snake2=[];
var game = new Phaser.Game(config);
var player;
var app;

function init()
{
	app = new Vue({
		el: "#app",
		data: {
			difficulty: 1,
			difficulties: ["Mobile Gamer", "Console Gamer", "PC gamer", "Apex Gamer"],
			diffSpeeds: [150, 250, 500, 800], 
			users_json: null,						
		    username: null,
            avatar: null,
            opp_username: null,
            opp_avatar: null,
            player_num: null
        }
	});
	GetScores('/scores');

    var port = window.location.port || "80";
    ws = new WebSocket("ws://" + window.location.hostname + ":" + port);
    ws.onopen = (event) => {
        console.log("Connection successful!");
    };
    ws.onmessage = (event) => {
        console.log(event.data);
    	var message = JSON.parse(event.data);
		if(message.msg === "client_count"){
			player_num = message.data;
            app.player_num = player_num;
            GetUserName();
        }
        else if(message.msg ==="opponent_name"){
            if(message.name != app.username){
                app.opp_username = message.name;
                app.opp_avatar = message.avatar;
            }
        }
        else if(message.msg === "move"){
            UpdateVelocity(message);
        }
        else if(message.msg === "apple"){
           // setTimeout(function(){ 
                dot.x = message.x;
                dot.y = message.y;
            //}, 1200);
        }
        else if(message.msg === "diff"){
            app.difficulty = message.newDiff;
        }
       
    };  
}

function SendMessage(){
	ws.send(app.new_message);
}
function GetUserName(){
    $.getJSON('/username').then((data)=>{
        app.username = data.username;
        app.avatar = data.avatar;
        ws.send(JSON.stringify({'msg':"opponent_name", "name":app.username, "avatar":app.avatar}));
    },'json');
}
function GetScores(scores){
	console.log("GetScores " + scores);
	$.getJSON(scores).then((data) =>{
		console.log(data);
		app.users_json = data;
/*        for(var i =0; i<app.users_json.length; i++){
            app.users_json[i].show = true;
        }*/
    }, 'json');
   
}
function SendScores(score){
	console.log("Sending request to update stats");
	$.post('/stats', {'score': score}, (result)=>{
		console.log("requestresult: " + result);
	});
}

function changeDifficulty(newDiff)
{
	//app.difficulty = newDiff;
    ws.send(JSON.stringify({'msg':'diff', 'newDiff':newDiff}));
}

function OpenStatsPage(item)
{
	console.log(item.username);
	var username = item.username;

	var url = "./stats.html?username=" + username;

	window.location.href = url;
}


function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/grass.jpg');
    this.load.image('star', 'assets/apple.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('tail', 'assets/caterpillarbody.png');
    this.load.image('tail-blue', 'assets/caterpillarbody-blue.png');
    this.load.spritesheet('caterpillar', 'assets/caterpillarhead.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('caterpillar-blue', 'assets/caterpillarhead-blue.png', { frameWidth: 32, frameHeight: 48 });
}

function create ()
{
    this.add.image(400, 300, 'ground').setScale(2.7,2.5);

    //set worldbounds to ground area
    let bounds = this.physics.world.setBounds(30, 32, 740, 536, true, true, true, true);

	player1 = this.physics.add.sprite(100, 450, 'caterpillar');
	player1.changeLocationX=null;
	player1.changeLocationY=null;
    player1.setCollideWorldBounds(true);
	player1.onWorldBounds = true;
	player2 = this.physics.add.sprite(700, 150, 'caterpillar-blue');
	player2.changeLocationX=null;
	player2.changeLocationY=null;
    player2.setCollideWorldBounds(true);
	player2.onWorldBounds = true;


	player2.changeLocationY=null;
    player2.setCollideWorldBounds(true);
	player2.onWorldBounds = true;


	snake1.push(player1);
    snake2.push(player2);

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  The score
    scoreText1 = this.add.text(20, 5, 'Score: 0', { fontSize: '24px', fill: '#ffffff' });
	scoreText2 = this.add.text(625, 5, 'Score: 0', { fontSize:'24px', fill: '#ffffff' });
	dot = this.physics.add.image(400, 300, 'star');
	this.physics.add.overlap(player1, dot, player_collide_dot, null, this);	
	this.physics.add.overlap(player2, dot, player_collide_dot2, null, this);	
	//this.physics.add.overlap(player, bounds, player_collide_enemy, null, this);
}
function update()
{	
    if(dot==null){
         if(player_num == 1){
            setTimeout(function(){ 
                ws.send(JSON.stringify({'msg':'apple', 'x':(Math.random()*600)+100, 'y':(Math.random()*400)+100}));
            }, 1000);
         }
         dot = this.physics.add.image(0, 0, 'star');
         this.physics.add.overlap(player1,dot,player_collide_dot,null,this);
         this.physics.add.overlap(player2,dot,player_collide_dot2,null,this);
    }

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
	follow(snake1);
    follow(snake2);
    if(player_num ==1){
        track_movements(player1, snake1);
    }
    else if(player_num==2){
        track_movements(player2, snake2);
    }
}

function follow(snake){
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
		return 45;
	}
	else if(snake_element.body.velocity.y>0){
		return -45;
	}
	else{
		return 0;
	}
}
function getXPadding(snake_element){
	if(snake_element.body.velocity.x<0){
		return 45;
	}
	else if(snake_element.body.velocity.x>0){
		return -45;
	}
	else{
		return 0;
	}
}
function player_collide_dot(){
	dot.destroy();
	dot = null;
	score1 += 1;
	scoreText1.setText('Score: ' + score1);
	
    console.log("collision with apple");

	//coordinates of the prev tail
	leaderx = snake1[snake1.length-1].x;
	leadery = snake1[snake1.length-1].y;

	newtail = this.physics.add.sprite(leaderx+getXPadding(snake1[snake1.length-1]), leadery+getYPadding(snake1[snake1.length-1]), 'tail');

	this.physics.add.overlap(player1, newtail, player_collide_enemy, null, this);

	//set velocity of newtail to the velocity of the previous tail
	newtail.setVelocityX(snake1[snake1.length-1].body.velocity.x);
	newtail.setVelocityY(snake1[snake1.length-1].body.velocity.y);

	snake1.push(newtail);
}
function player_collide_dot2(){
	dot.destroy();
	dot = null;
	score2 += 1;
	scoreText2.setText('Score: ' + score2);
	console.log("collision with apple");

	//coordinates of the prev tail
	leaderx = snake2[snake2.length-1].x;
	leadery = snake2[snake2.length-1].y;

	newtail = this.physics.add.sprite(leaderx+getXPadding(snake2[snake2.length-1]), leadery+getYPadding(snake2[snake2.length-1]), 'tail-blue');

	this.physics.add.overlap(player2, newtail, player_collide_enemy, null, this);

	//set velocity of newtail to the velocity of the previous tail
	newtail.setVelocityX(snake2[snake2.length-1].body.velocity.x);
	newtail.setVelocityY(snake2[snake2.length-1].body.velocity.y);

	snake2.push(newtail);
}


function player_collide_enemy()
{	
	if(!snekIsAlive){return;}
    if((player_num == 1 && score1 > score2 ) || (player_num == 2 && score2 > score1)){
        this.add.text(250, 5, app.username + ' Won ' + score1 + ' - ' + score2, { fontSize: '32px', fill: '#ffffff' });
    }
    else{
        this.add.text(250, 5, app.username + ' Lost ' + score1 + ' - ' +score2, { fontSize: '32px', fill: '#ffffff' });

    }
	gameOver = true;
	snekIsAlive = false;
	console.log("game over");
    ws.send(JSON.stringify({'msg':'GAMEOVER'}));
	// shake the camera
	this.cameras.main.shake(500);

	//fade camera
	this.time.delayedCall(3250, function() {
    	this.cameras.main.fade(3350);
	}, [], this);

	for(var i = 0; i < snake1.length; ++i){
		snake1[i].destroy();
	}

	for(var i = 0; i < snake2.length; ++i){
		snake2[i].destroy();
	}

	// restart game
	this.time.delayedCall(1600, function() {
		this.registry.destroy();
		this.events.off();
		this.scene.restart();
		resetGame();
	}, [], this);
}
function resetGame()
{

    console.log("resetting game");
	snake1 = [];
    snake2 =[];
	gameOver = false;
	snekIsAlive = true;

	//get username
    if(player_num ==1){
	    username = SendScores(score1);
    }
    else{
        username = SendScores(score2);
    } 

	score1 = 0;
	score2 = 0;
    GetScores('/scores');
}
function track_movements(player, snake){
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
            ws.send(JSON.stringify({'msg':'move', 'player':player_num, 'velocityX':speed*-1, 'velocityY':0})); 
            //player.setVelocityX(speed * -1);
			//player.setVelocityY(0);

		}
		else if (prevKey != 2 && cursors.right.isDown && player.body.velocity.x ==0)
		{
			prevKey = 2;
			changed_velocity=true;
		    ws.send(JSON.stringify({'msg':'move', 'player':player_num, 'velocityX':speed, 'velocityY':0})); 
            //player.setVelocityX(speed);
			//player.setVelocityY(0);
		}
		else if (prevKey != 3 && cursors.up.isDown && player.body.velocity.y ==0)
		{
			prevKey = 3;
			changed_velocity=true;
            ws.send(JSON.stringify({'msg':'move', 'player':player_num, 'velocityX':0, 'velocityY':speed*-1})); 
			//player.setVelocityY(speed * -1);
			//player.setVelocityX(0);
		}   
		else if (prevKey != 4 && cursors.down.isDown && player.body.velocity.y ==0)
		{
			prevKey = 4;
			changed_velocity=true;
            ws.send(JSON.stringify({'msg':'move', 'player':player_num, 'velocityX':0, 'velocityY':speed})); 
			//player.setVelocityY(speed);
			//player.setVelocityX(0);
		}

	}
}
//takes in a message and changes the velocity for either player
function UpdateVelocity(message){
    var player;
    if(message.player == 1){ player = player1; }
    else if (message.player==2){ player= player2; }
    player.setVelocityX(message.velocityX);
    player.setVelocityY(message.velocityY);
    if(!gameOver){
        player.changeLocationX = player.x;
        player.changeLocationY = player.y;
    }
}
