exports.processCaptions = (call) => {
    call.write({
        "word": 'mock_caption',
        "start": -3,
        "end": -4
    });
    call.end();
};

exports.processAudioSynthesis = (call, callback) => {
    callback(null, {
        "id": 'synth_id',
        "title": 'mock_audio0',
        "source": 'SYNTHESIZED'
    });
};
