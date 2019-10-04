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
            let { acousticness, danceability, energy, id, liveness, loudness, speechiness, tempo, valence, instrumentalness } = audioFeature;
            let { explicit, popularity, name, artists } = tracks[i];
            
            artists = artists.map((artist) => artist.name);

            const trackFeature = {
                name,
                artists,
                acousticness,
                instrumentalness,
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
    let albumIds = {};
    tracks.forEach(function(track){
        let { album } = track;
        if (album.id in albumIds){
            albumIds[album.id]++;
        }
        else{
            albumIds[album.id] = 1;
        }
    });

    let topAlbum = findMax(albumIds);

    let returnAlbum = {};
    tracks.forEach(function(track){
        let { album } = track;
        if(topAlbum.maxName == album.id){
            returnAlbum = album;
        }
    });
    returnAlbum.numberOfPlays = topAlbum.max;
    return returnAlbum;
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

    let topGenre = findMax(genreCount);

    return {
        topGenre: topGenre.maxName,
        topGenreCount: topGenre.max
    }
}

function getTopArtist(tracks){
    let artistIds = {};
    tracks.forEach(function(track){
        let { artists } = track;
        for(artist of artists){
            let id = artist.id;
            if(id in artistIds){
                artistIds[id] = artistIds[id] + 1;
            } 
            else artistIds[id] = 1;
        }
    });

    let topArtist = findMax(artistIds);
    let returnArtist = {};
    tracks.forEach(function(track){
        let { artists } = track;
        for(artist of artists){
            if(artist.id == topArtist.maxName) returnArtist = artist;
        }
    });
    returnArtist.numberOfPlays = topArtist.max;
    return returnArtist;

}

// Helper function used in other functions
function findMax(table){
    let max = 0;
    let maxName = '';
    for(element in table){
        if(table[element] > max){
            max = table[element];
            maxName = element; 
        }
    }
    return {
        max,
        maxName
    }
}