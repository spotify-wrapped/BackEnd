let client_id = '00dbb8102992441496cd4af8dc72d314';
let client_secret = '8634927c44de43e2a9ec61ab13fd3036';
let redirect_uri = 'http://localhost:3000/callback';
let scope = 'user-top-read playlist-modify-public playlist-modify-private user-read-private user-read-email user-read-birthdate';

const express = require('express'); // Library for creating server 
const path = require('path');
const helmet = require('helmet'); // Middleware for security
const axios = require('axios'); // Library to make HTTP request
const querystring = require('querystring'); //Library to parse and stringify URL query strings
const spotify_util = require('./spotify_util');

const exphbs = require('express-handlebars');
const app = express();
const port = process.env.PORT || 3000;

// Middleware, server public
app.use(helmet());
app.use(express.static(path.join(__dirname, '/public')));

// Handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
 

// Serve handlebars welcome page to user and pass welcome page authorization url
app.get('/', (req, res) => { 
	let endpoint = 'https://accounts.spotify.com/authorize?';
	let params = { // Parameters for authorization request
		client_id: client_id,
		redirect_uri: redirect_uri,
		scope: scope,
		show_dialog: true,
		response_type: 'code'
	};

	let authorizeUrl = endpoint + querystring.stringify(params);

    // Inject 'home' view into 'main' body, add helper mathod
	res.render('home', { authorizeUrl });
});

// Return handlebars page to user with top artist/songs data
app.get('/top', (req, res) => {
	// Data to pass to 'home'
	const css = [ 'top' ];
	const imageUrl = 'https://media.wired.com/photos/5927001eaf95806129f51539/master/w_902,c_limit/spotify-logo-zoom-s.jpg';
	const topArtist = 'top artist';
	const topSongs = 'top songs';

	// Inject 'home' view into 'main' body, add helper mathod
	res.render('topResults', {
		css,
		imageUrl,
		topArtist,
		topSongs
	});
});

// Served after user authorizes account
app.get('/callback', async(req, res) => {
	console.log('hello world');
});

// Request refresh and access tokens from Spotify after being granted authorization and get user top 50 songs
app.get('/fixthislater', async(req, res) => {
	let authorization_code = req.query.code;
	let tokens = await spotify_util.get_tokens(client_id, client_secret, authorization_code, redirect_uri);
	let profile = await spotify_util.get_current_user(tokens.access_token);

	// Parameters for getting the top played of user
	let get_top_params = {
		type: 'tracks',
		limit: 50,
		offset: 0,
		time_range: 'short_term'};
	let songs_data = await spotify_util.get_top(
		tokens.access_token, 
		get_top_params.type, 
		get_top_params.limit, 
		get_top_params.offset, 
		get_top_params.time_range);

	// Get array of song uris
	let uris = [];
	console.log(songs_data);
	for(song of songs_data.items){
		uris.push(song.uri)
	}

	// Parameters for creating playlist for user
	let create_playlist_params = {
		user_id: profile.id,
		playlist_name: 'Top 50 Past 4 Weeks',
		public_access: true,
		collaborative: false,
		description: 'Your most played song from the past 4 weeks.'};
	let playlist_data = await spotify_util.create_playlist(
		tokens.access_token, 
		create_playlist_params.user_id, 
		create_playlist_params.playlist_name, 
		create_playlist_params.public_access, 
		create_playlist_params.collaborative, 
		create_playlist_params.description);

	// Params for adding songs
	add_tracks_playlist_params = {
		position: 0
	};
	let add_track_data = await spotify_util.add_tracks_playlist(
		tokens.access_token, 
		playlist_data.id, uris, 
		add_tracks_playlist_params.position);

	res.send('Check your Spotify! A playlist has been created!');
});

app.listen(port, () => console.log(`Listening on port ${port}`));