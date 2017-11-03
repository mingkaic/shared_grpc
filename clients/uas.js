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

exports.getCaption = (audioRequest) => {
	return exports.reachable()
	.then((status) => {
		if (status !== 'SERVING') {
			throw "Error connection: cannot reach uas";
		}
		if (!audioRequest instanceof schemas.AudioRequest) {
			throw "Error getCaption: bad audioRequest";
		}
		var call = client.getCaption({
			"id": audioRequest.id
		});
		var captions = [];
		call.on('data', (captionResponse) => {
			captions.push(captionResponse);
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

exports.getPopular = () => {
	return exports.reachable()
	.then((status) => {
		if (status !== 'SERVING') {
			throw "Error connection: cannot reach uas";
		}
		var call = client.getPopular({});
		var audios = [];
		call.on('data', (audioResponse) => {
			audios.push(audioResponse);
		});

		return new Promise((resolve, reject) => {
			call.on('end', () => {
				resolve(audios);
			});

			call.on('error', (err) => {
				reject(err);
			});
		});
	});
};

exports.search = (searchParams) => {
	return exports.reachable()
	.then((status) => {
		if (status !== 'SERVING') {
			throw "Error connection: cannot reach uas";
		}
		if (!searchParams instanceof schemas.SearchParams) {
			throw "Error search: bad searchParams";
		}
		var call = client.search({
			"query": searchParams.query,
			"response_limit": searchParams.response_limit,
			"source": searchParams.source
		});
		var audios = [];
		call.on('data', (audioResponse) => {
			audios.push(audioResponse);
		});

		return new Promise((resolve, reject) => {
			call.on('end', () => {
				resolve(audios);
			});

			call.on('error', (err) => {
				reject(err);
			});
		});
	});
};
