const grpc = require('grpc');

const PROTO_DIR = __dirname + '/_proto';
const HEALTH_PROTO_PATH = PROTO_DIR + '/health.proto';
const service_longname = {
    "uas": 'UnifiedAudioService',
    "s2t": 'Speech2TextService'
};

exports.schemas = require('./schemas');
exports.s2t_cli = require('./clients/s2t');
exports.uas_cli = require('./clients/uas');

var last = { "type": 200, "msg": 'OK' };

function statusCheck (_, callback) {
    callback(null, { "status": 1 });
}

function lastError (_, callback) {
    callback(null, last);
}

exports.logError = (status, msg) => {
    if (typeof status === 'number' && typeof msg === 'string') {
        lastError.type = status;
        lastError.msg = msg;
    }
};

exports.buildServer = (service, port, routes) => {
    const MAIN_PROTO_PATH = PROTO_DIR + '/' + service + '.proto';
    const uri = '0.0.0.0:' + port;
    const longname = service_longname[service];

    if (!longname) {
        throw "Error buildServer: no registered service " + service;
    }

    const main_proto = grpc.load(MAIN_PROTO_PATH)[service];
    const health_proto = grpc.load(HEALTH_PROTO_PATH).health;
    const credentials = grpc.ServerCredentials.createInsecure();
    
    const server = new grpc.Server();
    
    server.addService(main_proto[longname].service, routes); // main service
    server.addService(health_proto.HealthService.service, {
        "statusCheck": statusCheck,
        "lastError": lastError
    }); // health service
    
    server.bind(uri, credentials);
    server.start();
    console.log('listening on port', port);
};
