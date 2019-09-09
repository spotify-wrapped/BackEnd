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

	res.render('home', { authUrl });
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

// Return handlebars page to user with top artist/songs data
app.get('/top', (req, res) => {
	let css = [ 'top' ];
	let imageUrl = 'https://media.wired.com/photos/5927001eaf95806129f51539/master/w_902,c_limit/spotify-logo-zoom-s.jpg';
	let topArtist = 'top artist';
	let topSongs = 'top songs';

	res.render('topResults', {
		css,
		imageUrl,
		topArtist,
		topSongs
	});
});

// Give client data of top 50 songs 
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

// Not in use
app.post('/createPlaylist', async(req, res) => {
	const { token } = req.body;

	try {
		let profile = await spotify_util.get_current_user(token);

		// Get top songs by user
		let songs_data = await spotify_util.get_top(
			token, 
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
			token, 
			profile.id, // User id to add the playlist to 
			'Top 50 Past 4 Weeks', // Name of the playlist 
			true, // Boolean for public access to playlist 
			false, // Boolean for collaborative playlist 
			'["_"]' // Description of the playlist
		);

		// Add songs to the playlist we just created
		let add_track_data = await spotify_util.add_tracks_playlist(
			token, 
			playlist_data.id, 
			uris, // URIS of songs to add to playlist
			0 // Position to start adding songs (start of playlist)
		);

		res.status(200).send(song_names);
	}catch(err) {
		console.log(err);
		res.status(400).send(err);
	}
});

app.listen(port, () => console.log(`Listening on port ${port}`));