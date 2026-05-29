const mongoose = require('mongoose')

const kittySchema = new mongoose.Schema({ 
    name: String,
    age: Number,
    bodyParts: [String],
    friends: {

    }
})

export default kittySchema