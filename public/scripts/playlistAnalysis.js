async function displayAnalysis(topTracks) {
    try {
        let topAlbum = getTopAlbum(topTracks);
        console.log('Your most played album was "' +  topAlbum.name + '" with a total of ' + topAlbum.numberOfSongs + ' songs!' );

        let topGenre = await getTopGenre(topTracks);
        console.log('Your top genre was "' +  topGenre.topGenre + '" showing up on ' + topGenre.topGenreCount + ' songs!' );

        let topArtist = getTopArtist(topTracks);
        console.log('Your top artist was "' +  topArtist.name + '" with a total of ' + topArtist.artistCount + ' songs!' );
    }catch(err) {
        console.log(err);
        $("#main").append('<div>Please refresh page</div>');
    }
}

async function getAllTrackFeatures(tracks) {
    let trackIds = [];
    tracks.forEach(track => trackIds.push(track.id));

    try {
        const { audio_features: audioFeatures } = await $.post(window.location.origin + '/get-multi-audio-features',
        {
            accessToken,
            trackIds
        });

        let trackFeatures = [];
        audioFeatures.forEach((audioFeature, i) => {
            const { acousticness, danceability, energy, id, liveness, loudness, speechiness, tempo, valence } = audioFeature;
            const { explicit, popularity } = tracks[i];

            const trackFeature = {
                acousticness,
                danceability,
                energy,
                id,
                liveness,
                loudness,
                speechiness,
                tempo,
                valence,
                explicit,
                popularity
            };
            trackFeatures.push(trackFeature);
        });

        return trackFeatures;

    }catch(err) {
        console.log(err);
    }
}

function getTopAlbum(tracks) {
    let albumNames = {};
    tracks.forEach(function(track){
        let { album } = track;
        let { name } = album;
        if (name in albumNames){
            albumNames[name]++;
        }
        else{
            albumNames[name] = 1;
        }
    });

    let maxSongsFromAlbum = 0;
    let maxAlbum;
    for(album in albumNames){
        if (albumNames[album] > maxSongsFromAlbum){
            maxAlbum = album;
            maxSongsFromAlbum = albumNames[album]; 
        }
    }
    return {
        name: maxAlbum,
        numberOfSongs: maxSongsFromAlbum
    }
}

async function getTopGenre(tracks){
    let artistIds = [];
    tracks.forEach(function(track){
        let { artists } = track;
        artists.forEach(function(artist){
            artistIds.push(artist.id);
        });
    });

    let allArtists = [];
    while(artistIds.length != 0){
        let ids = artistIds.slice(0,50);
        const { artists: artistList } = await $.post(window.location.origin + '/getArtists', { accessToken, ids });
        allArtists = allArtists.concat(artistList);
        artistIds.splice(0, 50);
    }

    let genreCount = {};
    allArtists.forEach(function(artist){
        let { genres } = artist;
        genres.forEach(function(genre){
            if(genre in genreCount){
                genreCount[genre]++;
            }
            else{
                genreCount[genre] = 1;
            }
        });
    });

    let topGenreCount = 0;
    let topGenre = '';
    for(genre in genreCount){
        if (genreCount[genre] > topGenreCount){
            topGenreCount = genreCount[genre];
            topGenre = genre;
        }
    }
    return {
        topGenre,
        topGenreCount
    }
}

function getTopArtist(tracks){
    let artistCount = {};
    tracks.forEach(function(track){
        let { artists } = track;
        for(artist of artists){
            let name = artist.name;
            if(name in artistCount){
                artistCount[name] = artistCount[name] + 1;
            } 
            else artistCount[name] = 1;
        }
    });

    let maxArtistCount = 0;
    let topArtist;
    for(artist in artistCount){
        if (artistCount[artist] > maxArtistCount){
            maxArtistCount = artistCount[artist];
            topArtist = artist; 
        }
    }
    return {
        name: topArtist,
        artistCount: maxArtistCount
    }
}