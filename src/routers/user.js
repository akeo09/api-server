const auth = require('../middleware/auth')
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
    
    sendWelcomeEmail(user.email, user.username, token)
    res.status(201).send(user)
  } 
  catch(error) {
    res.status(400).send(error)
  }
})

router.get('/user/verification', auth, async (req, res) => {
  const user = req.user
  const token = req.token

  console.log(user)
  console.log(token)

  user.email_verified = true
  user.save()
  
  res.send()
})

module.exports = router