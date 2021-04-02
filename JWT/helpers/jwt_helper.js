const JWT = require('jsonwebtoken');
const createError = require('http-errors');
const dotenv = require('dotenv');
const client = require('./init_redis');

dotenv.config();

module.exports ={
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: '15s',
                issuer: 'theMentor.me',
                audience: userId
            }
            JWT.sign(payload, secret, options, (err, token) => {
                if(err) {
                    reject(createError.InternalServerError())
                }
                resolve(token)
            })
        })
    },
    verifyAccessToken: (req, res, next) => {
        if(!req.headers['authorization']) return next(createError.Unauthorized())
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if(err) {
                const message = err.name === 'JsonWebToken' ? 'Unauthorized' : err.message
                return next(createError.Unauthorized(message))
            }
            req.payload = payload
            next()
        })
    
    },
    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secret = process.env.REFRESH_TOKEN_SECRET
            const options = {
                expiresIn: '1y',
                issuer: 'theMentor.me',
                audience: userId
            }
            JWT.sign(payload, secret, options, (err, token) => {
                if(err) {
                    reject(createError.InternalServerError())
                }

                client.SET(userId, token,'Ex', 365*24*60*60, (err, reply) => {
                    if (err) {
                        reject(createError.InternalServerError())
                        return
                    }
                    resolve(token)
                })
            })
        })
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
                if(err) return reject(createError.Unauthorized())
                const userId = payload.aud
                
                client.GET(userId, (err, result) => {
                    if(err) {
                        reject(createError.InternalServerError())
                        return
                    }
                    if(refreshToken === result) return resolve(userId)
                    reject(createError.Unauthorized())
                })
            })
        })
    }
}