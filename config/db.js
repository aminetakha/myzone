const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
    try {
        const dburi = config.get('mongoURI');
        mongoose.connect(dburi, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('connected...')
    } catch (err) {
        console.log(err.message)
    }
}

module.exports = connectDB;