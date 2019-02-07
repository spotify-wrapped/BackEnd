const express = require('express'); // Library for creating server 
const helmet = require('helmet'); // Middleware for security
const axios = require('axios'); // Library to make HTTP request
const querystring = require('querystring'); //Library to parse and stringify URL query strings

const port = process.env.PORT || 3000;

let client_id = '00dbb8102992441496cd4af8dc72d314';
let client_secret = '8634927c44de43e2a9ec61ab13fd3036';
let redirect_uri = 'http://localhost:3000/callback';
let scope = 'user-top-read';

const app = express();

app.use(helmet());

// Request authorization from user to access user data
app.get('/', (req, res) => { 
    let endpoint = 'https://accounts.spotify.com/authorize?';
	let params = { // Parameters for authorization request
		client_id: client_id,
		redirect_uri: redirect_uri,
		scope: scope,
		show_dialog: true,
		response_type: 'code'
	};
	res.redirect(endpoint + querystring.stringify(params));
});

// Request refresh and access tokens from Spotify after being granted authorization and get user top 50 songs
app.get('/callback', (req, res) => {
	let authorization_code = req.query.code;

	let endpoint = 'https://accounts.spotify.com/api/token';
	let params = { // Body for post request for tokens
		grant_type: 'authorization_code',
		code: authorization_code,
		redirect_uri: redirect_uri
	};

	let encoded_client_id_secret = Buffer.from(client_id + ':' + client_secret).toString('base64'); // Base 64 encoded string with Client ID and secret for header to request tokens
	
	let headers = {
			Authorization: 'Basic ' + encoded_client_id_secret,
			'Content-Type': 'application/x-www-form-urlencoded'
		};

	axios({ 
		method: 'post',
		url: endpoint,
		params : params,
		headers: headers
	})
		.then(post_response => {
			let data = post_response.data;
			let access_token = data.access_token;
			let refresh_token = data.refresh_token;

			let endpoint = 'https://api.spotify.com/v1/me/top/tracks?'
			let headers = {
				Authorization: 'Bearer ' + access_token 
			};
			let params = { //Parameters for get request
				limit: 50,
				offset: 0,
				time_range: 'short_term'
			};

			axios({
				method: 'get',
				url: endpoint + querystring.stringify(params),
				headers: headers
			})
				.then((get_response) => {
					songs = get_response.data.items;
					for(song of songs){
						console.log(song.name);
					}
					res.send(songs);
				})
				.catch(err => console.log(err));
		})
		.catch(err => console.log(err));
});

app.listen(port, () => console.log(`Listening on port ${port}`));