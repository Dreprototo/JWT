const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
const dotenv = require('dotenv');
const AuthRoute = require('./Routes/Auth.route')
require('./helpers/init_redis');
require('./helpers/init_mongodb');
const { verifyAccessToken } = require('./helpers/jwt_helper')


dotenv.config();

const app = express();
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.get('/',verifyAccessToken, async(req, res) => {
    res.send('helloworld');
});

app.use('/auth', AuthRoute);

app.use(async (req, res, next) => {
    next(createError.NotFound())
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.send({
        error:{
            status: err.status || 500,
            message: err.message
        }
    })
})

app.listen(process.env.PORT, () => {
    console.log(`http://localhost${process.env.PORT}`)
});