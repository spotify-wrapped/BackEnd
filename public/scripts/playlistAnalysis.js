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
            let { acousticness, danceability, energy, id, liveness, loudness, speechiness, tempo, valence } = audioFeature;
            let { explicit, popularity, name, artists } = tracks[i];
            
            artists = artists.map((artist) => artist.name);

            const trackFeature = {
                name,
                artists,
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

    let topAlbum = findMaxOfTable(albumNames);

    return {
        name: topAlbum.maxName,
        numberOfSongs: topAlbum.max
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

    let topGenre = findMaxOfTable(genreCount);

    return {
        topGenre: topGenre.maxName,
        topGenreCount: topGenre.max
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

    let topArtist = findMaxOfTable(artistCount);

    return {
        name: topArtist.maxName,
        artistCount: topArtist.max
    }
}


// Helper function used in other functions
function findMaxOfTable(hashTable){
    let max = 0;
    let maxName = '';
    for(element in hashTable){
        if(hashTable[element] > max){
            max = hashTable[element];
            maxName = element; 
        }
    }
    return {
        max,
        maxName
    }
}