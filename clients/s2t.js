const grpc = require('grpc');
const schemas = require('../schemas');

const PROTO_DIR = __dirname + '/../_proto';
const S2T_PROTO_PATH = PROTO_DIR + '/s2t.proto';
const HEALTH_PROTO_PATH = PROTO_DIR + '/health.proto';
const S2T_HOST = process.env.S2T_HOST || '0.0.0.0';
const S2T_PORT = process.env.S2T_PORT || '8080';
const S2T_URI = S2T_HOST + ':' + S2T_PORT;

const s2t_proto = grpc.load(S2T_PROTO_PATH).s2t;
const health_proto = grpc.load(HEALTH_PROTO_PATH).health;
const credentials = grpc.credentials.createInsecure(); // todo: make secure

const client = new s2t_proto.Speech2TextService(S2T_URI, credentials);
const health_cli = new health_proto.HealthService(S2T_URI, credentials);

exports.reachable = () => {
	return new Promise((resolve, reject) => {
		health_cli.statusCheck({}, (err, response) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(response.status);
			}
		});
	});
};

exports.lastError = () => {
	return new Promise((resolve, reject) => {
		health_cli.lastError({}, (err, response) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(response);
			}
		});
	});
};

exports.processCaptions = (audioRequest) => {
	return exports.reachable()
	.then((status) => {
		if (status !== 'SERVING') {
			throw "Error connection: cannot reach uas";
		}
		if (!audioRequest instanceof schemas.AudioRequest) {
			throw "Error processCaptions: bad audioRequest";
		}
		var call = client.processCaptions({
			"id": audioRequest.id
		});
		var captions = [];
		call.on('data', (captionSegment) => {
			captions.push(captionSegment);
		});
		
		return new Promise((resolve, reject) => {
			call.on('end', () => {
				resolve(captions);
			});
			
			call.on('error', (err) => {
				reject(err);
			});
		});
	});
	
};

exports.processAudioSynthesis = (captions) => {
	return exports.reachable()
	.then((status) => {
		if (status !== 'SERVING') {
			throw "Error connection: cannot reach uas";
		}
		if (!(captions instanceof Array) || 
			0 === captions.length || 
			!(captions[0] instanceof schemas.MixedCaptionRequest)) {
			throw "Error processAudioSynthesis: bad captions";
		}

		return new Promise((resolve, reject) => {
			var call = client.processAudioSynthesis((err, audioResponse) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(audioResponse);
				}
			});
	
			captions.forEach((captionSegment) => {
				call.write({
					"id": captionSegment.id,
					"content": {
						"word": captionSegment.word,
						"start": captionSegment.start,
						"end": captionSegment.end
					}
				});
			});
			call.end();
		});
	});
};
