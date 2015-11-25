var http = require('http');
var https = require('https');
var fs = require('fs');
var cp = require('child_process');

var rimraf = require('rimraf');

module.exports.dl = function (client_id, user, cb) {
	if (!cb) {
		throw new Error('please specify a callback!');
	}

	if (!client_id) {
		cb(new Error('please specify non-zero client id!'));
	}

	if (client_id.indexOf('client_id') === -1)
		client_id = 'client_id=' + client_id;

	if (!cp.execSync('which ffmpeg') && tagging === true) {
		return cb(new Error('couldnt find ffmpeg, but tagging is set to true'));
	}

	if (!user) {
		return cb(new Error('you need to specify a user'));
	}

	dl_root = '.';

	var api_endpoint = 'http://api.soundcloud.com';
	var tracks_endpoint = `${api_endpoint}/users/${user}/tracks?${client_id}`;
	var user_endpoint = `${api_endpoint}/users/${user}?${client_id}`;
	var playlists_endpoint = `${api_endpoint}/users/${user}/playlists?${client_id}`;

	http.get(tracks_endpoint, function (res) {
		var body = '';

		res.on('data', function (d) {
			body += d;
		});

		res.on('end', function (d) {
			if (d) {
				body += d;
			}

			try {
				console.log('round');
				body = JSON.parse(body);
				if (body.indexOf('401') !== -1) {
					return cb(null);
				} else {
					download_tracks(`${dl_root}/${user}`, 'track from soundcloud', body);
				}
			} catch (e) {
				console.log('error body', body);
				return cb(new Error(`Response error ${e.stack}. Say that to the dev!`));
			}
		});
	});

	var cb_register;

	function download_tracks(root_folder, album, tracks) {
		var trackslen = tracks.length;
		if (!trackslen) {
			return cb(new Error('no tracks!'));
		}

		rimraf.sync(`${root_folder}`);
		fs.mkdirSync(`${root_folder}`);

		var total_tracks = 0;
		total_tracks = trackslen;

		cb_register = (function () {
			var calls = 0;

			return function (name) {
				calls++;
				if (calls === total_tracks) {
					console.log('round', client_id, user);
					setTimeout(() => {
						module.exports.dl(client_id, user, cb);
					}, 10000);
				}
			}
		}());

		[].forEach.call(tracks, function(track) {
			var stream = track.stream_url;
			stream = `${stream}?${client_id}`;
			https.get(stream, function (res) {
				var body = '';

				res.on('data', function (d) {
					body += d;
				});

				res.on('end', function (d) {
					if (d) {
						body += d;
					}
					download_track(JSON.parse(body).location, root_folder, track.permalink);
				})
			})
		});
	}

	function download_track(url, root, name) {
		https.get(url, (res) => {
			var file = fs.createWriteStream(`${root}/${name}.mp3`);
			res.pipe(file);
			res.on('end', () => {
				cb_register(name);
			});

		})
	}

}

