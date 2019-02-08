const express = require('express'); // Library for creating server 
const helmet = require('helmet'); // Middleware for security
const axios = require('axios'); // Library to make HTTP request
const querystring = require('querystring'); //Library to parse and stringify URL query strings

const spotify_util = require('./spotify_util');

const port = process.env.PORT || 3000;

let client_id = '00dbb8102992441496cd4af8dc72d314';
let client_secret = '8634927c44de43e2a9ec61ab13fd3036';
let redirect_uri = 'http://localhost:3000/callback';
let scope = 'user-top-read playlist-modify-public playlist-modify-private user-read-private user-read-email user-read-birthdate';

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

	let profile = await spotify_util.get_current_user(tokens.access_token);


	// Parameters for getting the top played of user
	let type = 'tracks';
	let limit = 5;
	let offset = 0;
	let time_range = 'medium_term'

	let songs_data = await spotify_util.get_top(tokens.access_token, type, limit, offset, time_range);

	// Get array of song uris
	let uris = [];
	for(song of songs_data.items){
		uris.push(song.uri)
	}

	res.send(songs_data.items);

	// Parameters for creating playlist for user
	let user_id = profile.id;
	let playlist_name = 'TEST PLAYLIST';
	let public_access = true;
	let collaborative = false;
	let description = 'TEST PLAYLIST';

	let playlist_data = await spotify_util.create_playlist(tokens.access_token, user_id, playlist_name, public_access, collaborative, description);

	// Params for adding songs
	let position = 0;

	let add_track_data = await spotify_util.add_tracks_playlist(tokens.access_token, playlist_data.id, uris, position);
	console.log(add_track_data);
});

app.listen(port, () => console.log(`Listening on port ${port}`));