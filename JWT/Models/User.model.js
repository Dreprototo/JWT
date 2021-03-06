const mongoose = require('mongoose');

const Schema = mongoose.Schema

const UserSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 255
    }
})

const User= mongoose.model('user', UserSchema);
module.exports = User;