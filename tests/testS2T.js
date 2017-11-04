const chai = require('chai');
require('dotenv').load();

const grpc = require('../index');
const s2t_routes = require('../mock_server/s2t.routes');
const s2t_cli = require('../clients/s2t');

const schemas = grpc.schemas;
const expect = chai.expect;
const s2t_port = process.env.S2T_PORT;

describe('Mock S2T E2E', function() {
	const client = grpc.s2t_cli;

	before(function() {
		const service = 's2t';
		grpc.buildServer(service, s2t_port, {
			"processCaptions": s2t_routes.processCaptions,
			"processAudioSynthesis": s2t_routes.processAudioSynthesis
		});
	});
	
	it('reachable should return status 1', function(done) {
		client.reachable()
		.then((status) => {
			expect(status).to.equal('SERVING');
			done();
		})
		.catch(done);
	});

	it('lastError should return error code 200 and message OK', function(done) {
		client.lastError()
		.then((err) => {
			expect(err.type).to.equal(200);
			expect(err.msg).to.equal('OK');
			done();
		})
		.catch(done);
	});
	
	it('processCaptions should return captions designated in s2t_routes', function(done) {
		client.processCaptions(new schemas.AudioRequest({
			"id": 'reference some audio in shared database'
		}))
		.then((captions) => {
			expect(captions.length).to.equal(1);
			expect(captions[0].word).to.equal('mock_caption');
			expect(captions[0].start).to.equal(-3);
			expect(captions[0].end).to.equal(-4);
			done();
		})
		.catch(done);
	});

	it('processAudioSynthesis should return audio designated in s2t_routes', function(done) {
		client.processAudioSynthesis([
			new schemas.MixedCaptionRequest({
				"id": 'mock_synthinput_id',
				"word": 'mock_subtitle',
				"start": 42,
				"end": 1337
			})
		])
		.then((audio) => {
			expect(audio.id).to.equal('synth_id');
			expect(audio.title).to.equal('mock_audio0');
			expect(audio.source).to.equal('SYNTHESIZED');
			done();
		})
		.catch(done);
	});
});
