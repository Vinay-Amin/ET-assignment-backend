const express = require('express');
const router = express.Router();
const { getInstagramAuthURL, instagramAuthCallback } = require('../controllers/instagramController');

// Instagram Auth Routes
router.get('/auth', getInstagramAuthURL);
router.get('/callback', instagramAuthCallback);

// Webhook Routes
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  console.log('Debug webhook request:', {
    query: req.query,
    VERIFY_TOKEN,
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge']
  });

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook Verified!');
      return res.status(200).send(challenge);
    } else {
      console.log('Verification failed:', {
        expectedToken: VERIFY_TOKEN,
        receivedToken: token,
        mode
      });
      return res.status(403).send('Verification failed. Tokens do not match.');
    }
  } else {
    console.log('Missing parameters:', { mode, token });
    return res.status(400).send('Missing required parameters.');
  }
});

router.post('/webhook', (req, res) => {
  console.log('Webhook event received:', req.body);
  return res.sendStatus(200);
});

module.exports = router;
