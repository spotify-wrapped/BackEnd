const axios = require('axios'); // Library to make HTTP request

let results = require('dotenv').config()

const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const redirect_uri = process.env.redirect_uri;
const scope = process.env.scope;

const express = require('express'); 
const path = require('path');
const helmet = require('helmet'); 
const querystring = require('querystring'); 
const bodyParser = require('body-parser'); 
const spotify_util = require('./spotify_util'); 

const exphbs = require('express-handlebars'); 
const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.urlencoded({extended: true}));	
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Home page with access to auth url
app.get('/', (req, res) => { 
	let authEndpoint = 'https://accounts.spotify.com/authorize?';
	let authParams = {
		client_id: client_id,
		redirect_uri: redirect_uri,
		scope: scope,
		show_dialog: true,
		response_type: 'code'
	};

	let authUrl = authEndpoint + querystring.stringify(authParams);

	res.render('home', { 
		authUrl,
		redirect_uri,
	});
});

// Path used for auth pop up. Stores access/refresh tokens in session storage 
app.get('/callback', async(req, res) => {
	let authorization_code = req.query.code;
	let tokens = await spotify_util.get_tokens(client_id, client_secret, authorization_code, redirect_uri);

	const access_token = tokens.access_token;
	const refresh_token = tokens.refresh_token;
	res.render('callback', {
		access_token,
		refresh_token
	});
});

// Return handlebars page of their top results
app.get('/top', (req, res) => {
	res.render('topResults', {
		css: ['topResult']
	});
});

// Return data of top 50 songs 
app.post('/top', async(req, res) => {
	const { accessToken } = req.body;
	if(!accessToken) res.status(400).send('Invalid token');
	try {
		const topSongs = await spotify_util.get_top(
			accessToken,
			'tracks', // Type of 'top' list to retrieve 
			50, // Limit of tracks to get 
			0, // Offset in 'top' list to retrieve from (0 = start) 
			'short_term' // Time range of top tracks to retrieve from (4 weeks)
		);
		res.send(topSongs);

	}catch(err) {
		console.log(err);
		res.status(400).send(err);
	}
});

// Create playlist on user's spotify account of top 50 songs
app.post('/createPlaylist', async(req, res) => {
	let { accessToken } = req.body;

	try {
		let profile = await spotify_util.get_current_user(accessToken);

		let songs_data = await spotify_util.get_top(
			accessToken, 
			'tracks', // Type of 'top' list to retrieve 
			50, // Limit of tracks to get 
			0, // Offset in 'top' list to retrieve from (0 = start) 
			'short_term' // Time range of top tracks to retrieve from (4 weeks)
		);

		let songUris = [];
		for(song of songs_data.items){
			songUris.push(song.uri)
		}

		let playlist_data = await spotify_util.create_playlist(
			accessToken, 
			profile.id, // User id to add the playlist to 
			'Top 50 Past 4 Weeks', // Name of the playlist 
			true, // Boolean for public access to playlist 
			false, // Boolean for collaborative playlist 
			'["_"]' // Description of the playlist
		);
	
		let add_track_data = await spotify_util.add_tracks_playlist(
			accessToken, 
			playlist_data.id, 
			songUris, // URIS of songs to add to playlist
			0 // Position to start adding songs (start of playlist)
		);

		res.status(200).send();
	}catch(err) {
		console.log(err);
		res.status(400).send(err);
	}
});

// Return data on multiple tracks based on track ids provided
app.post('/get-tracks', async(req, res) => {
	const { accessToken, trackIds } = req.body;

	try {
		let tracks = await spotify_util.get_tracks(accessToken, trackIds);

		res.send(tracks);
	}catch(err) {
		console.log(err);
		res.send(err);
	}
});

// Return audio features on multiple tracks based on track ids provided
app.post('/get-multi-audio-features', async(req, res) => {
	const { accessToken, trackIds } = req.body;

	try {
		let audioFeatures = await spotify_util.get_multi_audio_features(accessToken, trackIds);

		res.send(audioFeatures);
	}catch(err) {
		console.log(err);
		res.send(err);
	}
});

// Return data on artists based on artist ids provided
app.post('/getArtists', async(req, res) => {
	const { accessToken, ids } = req.body;

	try {
		let artists = await spotify_util.get_artists(accessToken, ids);

		res.send(artists);
	}catch(err) {
		console.log(err);
		res.send(err);
	}
});

// Play a uri on a specific device
app.post('/playUri', async(req, res)=> {
	const { accessToken, deviceId, uri } = req.body;
	try {
		let playData = await spotify_util.play_uri(accessToken, deviceId, [uri]);

		res.send(playData);
	}catch(err) {
		console.log(err);
		res.send(err);
	}
});

app.listen(port, () => console.log(`Listening on port ${port}`));