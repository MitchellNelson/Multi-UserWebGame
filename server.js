var path = require('path');
var http = require('http');
var express = require('express');
var sqlite3 = require('sqlite3');
var multiparty = require('multiparty');
var fs = require('fs');
var url = require('url');
var md5 = require('md5');
var session = require('express-session')
var bodyParser = require('body-parser');
var WebSocket = require('ws');

var app = express();
var port = 8016;
var server = http.createServer(app);
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

var wss = new WebSocket.Server({server: server});
var clients = {};
var client_count = 0;

wss.on('connection', (ws) => {
    var client_id = ws._socket.remoteAddress + ":" + ws._socket.remotePort;
    console.log('New connection: ' + client_id);
    client_count++;
    clients[client_id] = ws;   
    clients[client_id].player_num = client_count;
    clients[client_id].send(JSON.stringify({msg:'client_count',data:clients[client_id].player_num}));

    ws.on('message', (message) => {
        console.log("here");
        console.log('Message from ' + client_id + ': ' + message);
        Broadcast(message);
    });
    ws.on('close', () => {
        console.log('Client disconnected: ' + client_id);
        delete clients[client_id];
        client_count--;
    });
});

function Broadcast(message){
	var id;
	for(id in clients){
		if(clients.hasOwnProperty(id)){
			clients[id].send(message);
		}
	}
}




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
			[fields.username[0], md5(fields.password[0]), "/assets/profile_pictures/profile"+fields.profilepicNum[0]+".jpg", 0], (err, rows) =>{
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

server.listen(port,'0.0.0.0');
