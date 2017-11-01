const grpc = require('grpc');
const schemas = require('../schemas');

const PROTO_DIR = __dirname + '/../_proto';
const S2T_PROTO_PATH = PROTO_DIR + '/s2t.proto';
const HEALTH_PROTO_PATH = PROTO_DIR + '/health.proto';
const S2T_HOST = process.env.S2T_HOST || '0.0.0.0';
const S2T_PORT = process.env.S2T_PORT || '8080';
const S2T_URI = S2T_HOST + ':' + S2T_PORT;

const s2t_proto = grpc.load(S2T_PROTO_PATH).S2T;
const health_proto = grpc.load(HEALTH_PROTO_PATH).health;
const credentials = grpc.credentials.createInsecure(); // todo: make secure

const client = new s2t_proto.UnifiedAudioService(S2T_URI, credentials);
const health_cli = new health_proto.HealthService(S2T_URI, credentials);

exports.lastError = (cb) => {
	health_cli.lastError({}, (err, lastError) => {
		if (err) {
			throw err;
		}
		if (cb) {
			cb(lastError);
		}
	});
};

exports.processSubtitles = (audioRequest) => {
    return new Promise((resolve, reject) => {
        exports.lastError();
        if (!audioRequest instanceof schemas.AudioRequest) {
            reject("Error processSubtitles: bad audioRequest");
        }
        var call = client.processSubtitles(audioRequest);
        var captions = [];
        call.on('data', (captionSegment) => {
            captions.push(captionSegment);
        });

        call.on('end', () => {
            resolve(captions);
        });
        
        call.on('error', (err) => {
            reject(err);
        });
    });
};

exports.processAudioSynthesis = (captions) => {
    return new Promise((resolve, reject) => {
        exports.lastError();
        if (!(captions instanceof Array) || 
            0 === captions.length || 
            !(captions[0] instanceof schemas.CaptionSegment)) {
            reject("Error processAudioSynthesis: bad captions");
        }
        var call = client.processAudioSynthesis((err, audioResponse) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(audioResponse);
            }
        });

        captions.forEach((captionSegment) => {
            call.write(captionSegment);
        });
        call.end();
    });
};
