var app;
var username;

function init()
{
	var vars = {};
	var url = window.location.href;
	var params = url.split('?');

	if( params.length == 1)
	{
		window.location.href = "./index.html";
	}


	app = new Vue({
		el: '#app',
		data:{
			username: "",
			avatar: 0,
			apples_eaten: 0,
			games_played: 0,
			high_score: 0
		}
	});
		



	username = params[1].substring(9);
	app.username = username;
	console.log(username);

	//get stats
	
	$.getJSON('/scores').then((data) =>{
		console.log(data);

		for(var i = 0; i < data.length; ++i)
		{
			if(data[i].username == username)
			{
				app.avatar = data[i].avatar;
				app.apples_eaten = data[i].apples_eaten;
				app.games_played = data[i].games_played;
				app.high_score = data[i].high_score;
			}
		}

	}, 'json');
		

}





