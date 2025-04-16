const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Ensure this is at the top if not already imported
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


const axios = require('axios');

// Instagram Media Route
router.get('/media', async (req, res) => {
  try {
    const user = await User.findOne().sort({ createdAt: -1 });

    if (!user || !user.accessToken || !user.instagramId) {
      return res.status(400).json({ error: 'Instagram user not connected.' });
    }

    const mediaRes = await axios.get(`https://graph.facebook.com/v16.0/${user.instagramId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
        access_token: user.accessToken
      }
    });

    res.status(200).json({ media: mediaRes.data.data });

  } catch (err) {
    console.error('Media fetch error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

router.get('/me', async (req, res) => {
  const User = require('../models/user');
  const axios = require('axios');

  try {
    const user = await User.findOne().sort({ createdAt: -1 });

    const profileRes = await axios.get(`https://graph.facebook.com/v16.0/${user.instagramId}`, {
      params: {
        fields: 'username,media_count',
        access_token: user.accessToken
      }
    });

    res.json(profileRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


router.get('/user', async (req, res) => {
  try {
    const user = await User.findOne().sort({ createdAt: -1 });
    if (!user) return res.status(404).json({ error: 'No user found' });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
