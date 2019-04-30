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


var game = new Phaser.Game(config);
function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create ()
{
    this.add.image(400, 300, 'sky');
    
	player = this.physics.add.sprite(100, 450, 'dude');

    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

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
}
function player_collide_dot(){
	dot.destroy();
	dot = null;
	score += 1;
	scoreText.setText('Score: ' + score);
	console.log("collision with apple");
}
function track_movements(){
	if (gameOver)
    {
        return;
    }
    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);
		player.setVelocityY(0);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);
		player.setVelocityY(0);
        player.anims.play('right', true);
    }
	else if (cursors.up.isDown)
    {
        player.setVelocityY(-160);
		player.setVelocityX(0);
    }   
	else if (cursors.down.isDown)
    {
        player.setVelocityY(160);
		player.setVelocityX(0);
    }
}
