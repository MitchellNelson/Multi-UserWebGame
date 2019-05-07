var path = require('path');
var express = require('express');
var sqlite3 = require('sqlite3');
var multiparty = require('multiparty');
var fs = require('fs');
var url = require('url');
var md5 = require('md5');
var session = require('express-session')
var app = express();
var port = 8016;
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
}))


var auth = function(req, res, next) {
	
	if (req.session && req.session.user != undefined && req.session.admin)
			return next();
	    else
			//go back to index if not logged in
			res.redirect("index.html");
};

app.post('/login', function (req, res) {
	var form = new multiparty.Form();
	form.parse(req, function(err, fields) {
		db.all('SELECT * FROM users WHERE username = ? AND password = ?', 
		[fields.username[0], md5(fields.password[0])], (err, rows) =>{
			if (err){
				console.log(err);	
			}
			else if (rows.length==1){//found user
				console.log(rows);
				req.session.admin = true;
				req.session.user = fields.username[0];
				res.redirect('game.html');
				console.log(JSON.stringify(rows));
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
					console.log(JSON.stringify(rows));
				}
			});
		}
	});
})

app.get('/game.html', auth, function (req, res) {
    console.log("in game");
	console.log("req.session.user = " + req.session.user);
	//res.json({"test":"hello"});
	res.sendFile(__dirname + '/public/game.html');
});
app.get('/scores', function(req, res){

	db.all('SELECT username, avatar, high_score FROM users ORDER BY high_score DESC LIMIT 10',(err, rows)=>{
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
