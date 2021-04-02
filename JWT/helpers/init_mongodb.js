const mongoose = require('mongoose')
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.DB_URL, {
    dbName: process.env.DB_NAME,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(() => {
    console.log('mongodb connected');
}).catch((err) => {
    console.log(err.message);
});

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db')
});

mongoose.connection.on('error', (err) => {
    console.log(err.message)
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected to db')
});

process.on('SIGINT', async () => {
    await mongoose.connection.close()
    process.exit(0)
});