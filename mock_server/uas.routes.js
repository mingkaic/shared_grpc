exports.getCaption = (call) => {
    call.write({
        "word": 'mock_word',
        "start": -1,
        "end": -2
    });
    call.end();
};

exports.getPopular = (call) => {
    call.write({
        "id": 'popular_id',
        "title": 'mock_audio',
        "source": 'UNKNOWN'
    });
    call.end();
};

exports.search = (call) => {
    call.write({
        "id": 'search_id',
        "title": 'mock_audio2',
        "source": 'YOUTUBE'
    });
    call.end();
};
