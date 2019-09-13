const axios = require('axios'); // Library to make HTTP request
const querystring = require('querystring'); //Library to parse and stringify URL query strings

let get_tokens = async (client_id, client_secret, authorization_code, redirect_uri) => {
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

	try {
		const response = await axios({ 
			method: 'post',
			url: endpoint,
			params : params,
			headers: headers
		});
		return response.data;

	}catch(err) {
		console.log(err);
		return err;
	}
};

let get_top = async (access_token, type, limit, offset, time_range) => {
	let endpoint = 'https://api.spotify.com/v1/me/top/' + type + '?';

	let headers = {
		Authorization: 'Bearer ' + access_token
	}; 
	let params = { // Parameters for api request
		limit: limit,
		offset: offset,
		time_range: time_range
	};

	try {
		const response = await axios({
			method: 'get',
			url: endpoint + querystring.stringify(params),
			headers: headers
		});
		return response.data;

	}catch(err) {
		console.log(err);
		return err;
	}
};

let create_playlist = async (access_token, user_id, playlist_name, public_access, collaborative, description) => {
	let endpoint = 'https://api.spotify.com/v1/users/' + user_id + '/playlists';

	let headers = {
		Authorization: 'Bearer ' + access_token,
		'Content-Type': 'application/json'
	};

	let data = { // Parameters for api request body
		name: playlist_name,
		public: public_access,
		collaborative: collaborative,
		description: description
	};

	try{
		const response = await axios({
			method: 'post',
			url: endpoint,
			data: data,
			headers: headers 
		});
		return response.data; // Return information of the playlist

	}catch(err) {
		console.log(err);
		return err;
	}
};

let get_current_user = async (access_token) => {
	let endpoint = 'https://api.spotify.com/v1/me';

	let headers = {
		Authorization: 'Bearer ' + access_token 
	};

	try {
		const response = await axios({
			method: 'get',
			url: endpoint,
			headers: headers
		});
		return response.data;

	}catch(err) {
		console.log(err);
		return err;
	}
};

let add_tracks_playlist = async (access_token, playlist_id, uris, position) => {
	let endpoint = 'https://api.spotify.com/v1/playlists/' + playlist_id + '/tracks';

	let headers = {
		Authorization: 'Bearer ' + access_token,
		'Content-Type': 'application/json'
	};

	let data = { // Parameters for api request body
		uris: uris,
		position: position
	};

	try {
		const response = await axios({
			method: 'post',
			url: endpoint,
			data: data,
			headers: headers
		});
		return response;

	}catch(err) {
		console.log(err);
		return err;
	}
};

let get_tracks = async (access_token, trackIds) => {
	let endpoint = 'https://api.spotify.com/v1/tracks?';
	
	let headers = {
		Authorization: 'Bearer ' + access_token
	}; 
	let params = { // Parameters for api request
		ids: trackIds.toString()
	};

	try {
		const response = await axios({
			method: 'get',
			url: endpoint + querystring.stringify(params),
			headers: headers
		});
		return response.data;

	}catch(err) {
		console.log(err);
		return err;
	}
};


let get_multi_audio_features = async (access_token, trackIds) => {
	let endpoint = 'https://api.spotify.com/v1/audio-features?';
	
	let headers = {
		Authorization: 'Bearer ' + access_token
	}; 
	let params = { // Parameters for api request
		ids: trackIds.toString()
	};

	try {
		const response = await axios({
			method: 'get',
			url: endpoint + querystring.stringify(params),
			headers: headers
		});
		return response.data;

	}catch(err) {
		console.log(err);
		return err;
	}
};

let get_artists = async (access_token, artistIds) => {
	let endpoint = 'https://api.spotify.com/v1/artists?';
	
	let headers = {
		Authorization: 'Bearer ' + access_token
	}; 
	
	let params = { // Parameters for api request
		ids: artistIds.toString()
	};

	try {
		const response = await axios({
			method: 'get',
			url: endpoint + querystring.stringify(params),
			headers: headers
		});
		return response.data;

	}catch(err) {
		console.log(err);
		return err;
	}
};

module.exports = {
	get_tokens: get_tokens,
	get_top: get_top,
	create_playlist: create_playlist,
	get_current_user: get_current_user,
	add_tracks_playlist: add_tracks_playlist,
	get_tracks,
	get_multi_audio_features,
	get_artists
};