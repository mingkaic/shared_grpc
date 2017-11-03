const chai = require('chai');
require('dotenv').load();

const grpc = require('../index');
const uas_routes = require('../mock_server/uas.routes');
const uas_cli = require('../clients/uas');

const schemas = grpc.schemas;
const expect = chai.expect;
const uas_port = process.env.UAS_PORT;

describe('Mock UAS E2E', function() {
	const client = grpc.uas_cli;

	before(function() {
		const service = 'uas';
		grpc.buildServer(service, uas_port, {
			"getCaption": uas_routes.getCaption,
			"getPopular": uas_routes.getPopular,
			"search": uas_routes.search
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

	it('getCaption should return mock caption designated in uas_routes', function(done) {
		client.getCaption(new schemas.AudioRequest({
			"id": "literally anything bruh"
		}))
		.then((captions) => {
			expect(captions.length).to.equal(1);
			expect(captions[0].word).to.equal('mock_word');
			expect(captions[0].start).to.equal(-1);
			expect(captions[0].end).to.equal(-2);
			done();
		})
		.catch(done);
	});
	
	it('getPopular should return mock audio designated in uas_routes', function(done) {
		client.getPopular()
		.then((audios) => {
			expect(audios.length).to.equal(1);
			expect(audios[0].id).to.equal('popular_id');
			expect(audios[0].title).to.equal('mock_audio');
			expect(audios[0].source).to.equal('UNKNOWN');
			done();
		})
		.catch(done);
	});
	
	it('search should return mock audio designated in uas_routes', function(done) {
		client.search(new schemas.SearchParams({
			"query": 'doesnt matter',
			"response_limit": 100,
			"source": 0
		}))
		.then((audios) => {
			expect(audios.length).to.equal(1);
			expect(audios[0].id).to.equal('search_id');
			expect(audios[0].title).to.equal('mock_audio2');
			expect(audios[0].source).to.equal('YOUTUBE');
			done();
		})
		.catch(done);
	});
});
