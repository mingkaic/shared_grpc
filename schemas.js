const SchemaObject = require('schema-object');

exports.AudioRequest = new SchemaObject({
    "id": String
});

exports.SearchParams = new SchemaObject({
    "query": String,
    "response_limit": Number,
    "source": String
});

exports.CaptionSegment = new SchemaObject({
    "word": String,
    "start": Number,
    "end": Number
});
