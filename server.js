let results = require('dotenv').config() // Library to load environment variables

// Variables needed to retrieve spotify access tokens, which are used to make api request
const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const redirect_uri = process.env.redirect_uri;
const scope = process.env.scope;

const express = require('express'); // Library for creating server 
const path = require('path');
const helmet = require('helmet'); // Middleware for security
const querystring = require('querystring'); // Library to parse and stringify URL query strings
const bodyParser = require('body-parser'); // Middleware to parse post request
const spotify_util = require('./spotify_util'); // Utility used to make spotify api calls

const exphbs = require('express-handlebars');
const app = express();
const port = process.env.PORT || 3000;

// Middleware, server public
app.use(helmet());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
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

app.post('/top', (req, res) => {
	const { test } = req.body;
	console.log(req.body);
	res.send('success');
});

// Path for pop up. Try to store tokens in local storage to close the window
app.get('/callback', async(req, res) => {
	let authorization_code = req.query.code;
	let tokens = await spotify_util.get_tokens(client_id, client_secret, authorization_code, redirect_uri);

	// Data to pass to 'callback' page so it can be stored in local storage
	const access_token = tokens.access_token;
	const refresh_token = tokens.refresh_token;
	res.render('callback', {
		access_token,
		refresh_token
	});
});

// Path for retrieving top 50 songs. Not in use but has useful code
app.get('_top', async(req, res) => {
	let profile = await spotify_util.get_current_user(tokens.access_token);

	// Get top songs by user
	let songs_data = await spotify_util.get_top(
		tokens.access_token, 
		'tracks', // Type of 'top' list to retrieve 
		50, // Limit of tracks to get 
		0, // Offset in 'top' list to retrieve from (0 = start) 
		'short_term' // Time range of top tracks to retrieve from (4 weeks)
	);

	// Get array of song uris from the song_data
	let song_names = []; // Used to display user the top songs in clean way
	let uris = [];
	console.log(songs_data);
	for(song of songs_data.items){
		uris.push(song.uri)
		song_names.push(song.name);
	}

	// Create EMPTY playlist for the user
	let playlist_data = await spotify_util.create_playlist(
		tokens.access_token, 
		profile.id, // User id to add the playlist to 
		'Top 50 Past 4 Weeks', // Name of the playlist 
		true, // Boolean for public access to playlist 
		false, // Boolean for collaborative playlist 
		'["_"]' // Description of the playlist
	);

	// Add songs to the playlist we just created
	let add_track_data = await spotify_util.add_tracks_playlist(
		tokens.access_token, 
		playlist_data.id, 
		uris, // URIS of songs to add to playlist
		0 // Position to start adding songs (start of playlist)
	);

	res.send(song_names);
});

app.listen(port, () => console.log(`Listening on port ${port}`));