const express = require('express'); // Library for creating server 
const helmet = require('helmet'); // Middleware for security
const axios = require('axios'); // Library to make HTTP request
const querystring = require('querystring'); //Library to parse and stringify URL query strings

const spotify_util = require('./spotify_util');

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
app.get('/callback', async(req, res) => {
	let authorization_code = req.query.code;

	let tokens = await spotify_util.get_tokens(client_id, client_secret, authorization_code, redirect_uri);

	// Parameters for getting the top played of user
	let type = 'tracks';
	let limit = 50;
	let offset = 0;
	let time_range = 'medium_term'

	let data = await spotify_util.get_top(tokens.access_token, type, limit, offset, time_range);

	res.send(data.items);
});

app.listen(port, () => console.log(`Listening on port ${port}`));