const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
    tweet: {
        type: String,
        required: true,
        trim: true,
        maxLength: 280
    },
    username: {
        type: String,
        trim:true,
        required: true,
        ref: 'user'
    }
}, {timestamps: true});

const Tweet = mongoose.model('tweet', tweetSchema);

module.exports = Tweet;

