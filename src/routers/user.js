const express = require('express')
const User = require('../models/user')
const { sendVerificationEmail } = require('../emails/account.js') 

const router = new express.Router()

// Add a new user
router.post('/user', async (req, res) => {
  delete req.body.email_verified
  delete req.body.tokens

  const user = new User(req.body)

  try {
    await user.save()
    const token = await user.generateAuthToken()
    
    sendVerificationEmail(user.email, user.username)
    res.status(201).send(user)
  } 
  catch(error) {
    res.status(400).send(error)
  }


})

module.exports = router