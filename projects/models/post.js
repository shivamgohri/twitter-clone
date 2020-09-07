const mongoose = require('mongoose')
    // const bcrypt = require('bcrypt')
const { Int32 } = require('mongodb')


const PostSchema = new mongoose.Schema({
    email: {
        required: true,
        type: String,
        unique: false,
        trim: true
    },
    body: {
        required: true,
        type: String,
        trim: true
    },
    totalLikes: {
        type: Number
    },
    comments: {
        type: [{ email: String, body: String, timestamp: Date }]
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    usersWhoLiked: {
        type: [{ email: String }]
    }
})

const Post = mongoose.model('Post', PostSchema)
module.exports = Post