const { required } = require('@hapi/joi');
const express = require('express');
const router = express.Router();
const createError = require('http-errors')
const User = require('../Models/User.model');
const bcrypt = require('bcrypt');
const client = require('../helpers/init_redis');
const { registerSchema, loginSchema } = require('../helpers/validation_schema');
const { 
    signAccessToken, 
    signRefreshToken, 
    verifyRefreshToken } = require('../helpers/jwt_helper');

router.post('/register', async(req, res, next) => {
    try{
        const result = await registerSchema.validateAsync(req.body)

        const doesExist = await User.findOne({ email: result.email})
        if (doesExist) throw createError.Conflict(`${result.email} is already been registered`)

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(result.password, salt);
        result.password = hashPassword;

        const user = new User(result)
        const savedUser = await user.save()
        const accessToken = await signAccessToken(savedUser.id)
        const refreshToken = await signRefreshToken(saveUser.id)

        res.send({accessToken, refreshToken})

    } catch(error){
        if(error.isJoi === true) error.status  = 422
        next(error)
    }
})

router.post('/login', async(req, res, next) => {
    try {
        const result = await loginSchema.validateAsync(req.body)
        const user = await User.findOne({ email: result.email})
        if (!user) next(createError.NotFound('email is not registered'))

        const validPassword = await bcrypt.compare(result.password, user.password)
        if(!validPassword) next(createError.Unauthorized('Email/Password not valid'))
        
        const accessToken = await signAccessToken(user.id)
        const refreshToken = await signRefreshToken(user.id)

        res.send({ accessToken, refreshToken })
    } catch (error) {
        if(error.isJoi === true) 
            return next(createError.BadRequest('Invalid Password'));
    }
})

router.post('/refresh-token', async(req, res, next) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) next(createError.BadRequest())
        const userId = await verifyRefreshToken(refreshToken)

        const accessToken = await signAccessToken(userId)
        const refToken = await signRefreshToken(userId)

        res.send({ accessToken: accessToken, refreshToken: refToken })

    } catch (error) {
        next(error)
    }
})

router.delete('/logout', async(req, res, next) => {
    try {
        const { refreshToken } = req.body
        if(!refreshToken) next(createError.BadRequest())
        const userId = await verifyRefreshToken(refreshToken)
        client.DEL(userId, (err, val) => {
            if(err){
                console.log(err.message)
                next(createError.InternalServerError)
            }
            res.sendStatus(204)
            res.send('User logout')
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router;