const axios = require('axios'); // Library to make HTTP request
const querystring = require('querystring'); //Library to parse and stringify URL query strings

let get_tokens = (client_id, client_secret, authorization_code, redirect_uri) => {
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

	return axios({ 
		method: 'post',
		url: endpoint,
		params : params,
		headers: headers
	})
		.then(res => {
			return res.data;
		})
		.catch(err => {
			return err
		});
};

let get_top = (access_token, type, limit, offset, time_range) => {
	let endpoint = 'https://api.spotify.com/v1/me/top/' + type + '?';

	let headers = {
		Authorization: 'Bearer ' + access_token
	}; 
	let params = { // Parameters for api request
		limit: limit,
		offset: offset,
		time_range: time_range
	};

	return axios({
		method: 'get',
		url: endpoint + querystring.stringify(params),
		headers: headers
	})
		.then(res => {
			return res.data;
		})
		.catch(err => {
			return err;
		});
};

let make_playlist = () => {
	
};

module.exports = {
	get_tokens: get_tokens,
	get_top: get_top
};