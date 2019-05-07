var path = require('path');
var express = require('express');
var sqlite3 = require('sqlite3');
var multiparty = require('multiparty');
var fs = require('fs');
var url = require('url');
var md5 = require('md5');
var session = require('express-session')
var bodyParser = require('body-parser');

var app = express();
var port = 8002;
var db_filename = path.join(__dirname, '/db', 'gameDB.sqlite3');
var public_dir = path.join(__dirname, 'public');

var db = new sqlite3.Database(db_filename, (err) =>{
	if (err){
		console.log("Error opening " + db_filename);
	}
	else{
		console.log("now connected to " + db_filename);
	}
});

app.use(session({
	secret: 'superRandomSecret',
	resave: false,
  	saveUninitialized: true,	
}));

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({extended: true}) );


var auth = function(req, res, next) {
	
	if (req.session && req.session.user != undefined && req.session.admin)	
		return next();
	else
		//go back to index if not logged in
		res.redirect("index.html");
};



app.post('/stats', function(req, res){
	console.log("setting stats for: " + req.session.user);
	console.log("user new score: " + req.body.score);
	
	username = req.session.user;
	//check if new score is high score
	db.all('SELECT * FROM users WHERE username = ?', [username], (err, rows) =>{
		if (err){
			console.log(err);
		}
		else
		{
			username = req.session.user;
			score = req.body.score;

			highScore = rows[0].high_score;
			gamesPlayed = rows[0].games_played;
			applesEaten = rows[0].apples_eaten;
			//console.log("user: " + username + "  highscore: " + highScore + "  games played: " + gamesPlayed + "  apples eaten: " + applesEaten);
			if(highScore < score)
			{
				highScore = parseInt(score, 10);
			}
			if( gamesPlayed == null )
			{
				gamesPlayed = 1;
			}
			else
			{
				gamesPlayed = gamesPlayed + 1;
			}
			if( applesEaten == null )
			{
				applesEaten = parseInt(score, 10);
			}
			else
			{
				applesEaten = applesEaten + parseInt(score, 10);
			}	
			//send new scores to db
			db.run('UPDATE users SET high_score=? WHERE username=?', [highScore, username], (err, rows) =>{
				if(err){
					console.log(err);
				}
				else{
					console.log("updated high score");
				}
			});
			db.run('UPDATE users SET games_played=? WHERE username=?', [gamesPlayed, username], (err, rows) =>{
				if(err){
					console.log(err);
				}
				else{
					console.log("updated games played");
				}
			});
			db.run('UPDATE users SET apples_eaten=? WHERE username=?', [applesEaten, username], (err, rows) =>{
				if(err){
					console.log(err);
				}
				else{
					console.log("updated apples eaten");
				}
			});


			//console.log("AFTER UPDATE: user: " + username + "  highscore: " + highScore + "  games played: " + gamesPlayed + "  apples eaten: " + applesEaten);
		}
	});
}); 





app.post('/login', function (req, res) {
	var form = new multiparty.Form();
	form.parse(req, function(err, fields) {
		db.all('SELECT * FROM users WHERE username = ? AND password = ?', 
		[fields.username[0], md5(fields.password[0])], (err, rows) =>{
			if (err){
				console.log(err);	
			}
			else if (rows.length==1){//found user
				//console.log(rows);
				req.session.admin = true;
				req.session.user = fields.username[0];
				res.redirect('game.html');
				//console.log(JSON.stringify(rows));
			}
		});
	});
})

app.post('/newuser', function (req, res) {
	var form = new multiparty.Form();
	form.parse(req, function(err, fields) {
		console.log(fields);
		if(fields.password[0] == fields.confirmPassword[0]){//passwords match
			db.run('INSERT INTO users (username, password, avatar, high_score) VALUES (?,?,?,?)', 
			[fields.username[0], md5(fields.password[0]), fields.profilepicNum[0], 0], (err, rows) =>{
				if (err){
					console.log(err);	
				}
				else{
					req.session.admin = true;
					req.session.user = fields.username[0];
					res.redirect('game.html');
					//console.log(JSON.stringify(rows));
				}
			});
		}
	});
})

app.get('/game.html', auth, function (req, res) {
    //console.log("in game");
	//console.log("req.session.user = " + req.session.user);
	//res.json({"test":"hello"});
	res.sendFile(__dirname + '/public/game.html');
});
app.get('/scores', function(req, res){

	db.all('SELECT username, avatar, high_score, games_played, apples_eaten  FROM users ORDER BY high_score DESC LIMIT 10',(err, rows)=>{
		if (err){
			console.log(err);	
		}
		else{
			console.log("in query");			
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(rows));
			
			res.end();
			console.log(JSON.stringify(rows));
		}
	});
	//res.json({"test":"json"});
});
app.use(express.static(public_dir));

var server = app.listen(port);
