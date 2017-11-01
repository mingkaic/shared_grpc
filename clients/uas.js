const grpc = require('grpc');
const schemas = require('../schemas');

const PROTO_DIR = __dirname + '/../_proto';
const UAS_PROTO_PATH = PROTO_DIR + '/uas.proto';
const HEALTH_PROTO_PATH = PROTO_DIR + '/health.proto';
const UAS_HOST = process.env.UAS_HOST || '0.0.0.0';
const UAS_PORT = process.env.UAS_PORT || '8080';
const UAS_URI = UAS_HOST + ':' + UAS_PORT;

const uas_proto = grpc.load(UAS_PROTO_PATH).uas;
const health_proto = grpc.load(HEALTH_PROTO_PATH).health;
const credentials = grpc.credentials.createInsecure(); // todo: make secure

const client = new uas_proto.UnifiedAudioService(UAS_URI, credentials);
const health_cli = new health_proto.HealthService(UAS_URI, credentials);

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

exports.getCaption = (audioRequest) => {
	return new Promise((resolve, reject) => {
		exports.lastError();
		if (!audioRequest instanceof schemas.AudioRequest) {
			reject("Error getCaption: bad audioRequest");
		}
		var call = client.getCaption(audioRequest);
		var captions = [];
		call.on('data', (captionResponse) => {
			captions.push(captionResponse);
		});

		call.on('end', () => {
			resolve(captions);
		});

		call.on('error', (err) => {
			reject(err);
		});
	});
};

exports.getPopular = () => {
	return new Promise((resolve, reject) => {
		exports.lastError();
		var call = client.getPopular({});
		var audios = [];
		call.on('data', (audioResponse) => {
			audios.push(audioResponse);
		});

		call.on('end', () => {
			resolve(audios);
		});

		call.on('error', (err) => {
			reject(err);
		});
	});
};

exports.search = (searchParams) => {
	return new Promise((resolve, reject) => {
		exports.lastError();
		if (!searchParams instanceof schemas.SearchParams) {
			reject("Error search: bad searchParams");
		}
		var call = client.search(searchParams);
		var audios = [];
		call.on('data', (audioResponse) => {
			audios.push(audioResponse);
		});

		call.on('end', () => {
			resolve(audios);
		});

		call.on('error', (err) => {
			reject(err);
		});
	});
};
