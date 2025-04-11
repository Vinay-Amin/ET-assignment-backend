// controllers/instagramController.js
const axios = require('axios');
const User = require('../models/user');

exports.getInstagramAuthURL = (req, res) => {
  const authURL = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  res.json({ authURL });
};

exports.instagramAuthCallback = async (req, res) => {
  const { code } = req.query;

  try {
    const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code,
    });

    const { access_token, user_id } = tokenRes.data;

    const profileRes = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`);

    const userData = {
      instagramId: user_id,
      username: profileRes.data.username,
      fullName: profileRes.data.username,
      accessToken: access_token,
    };

    const user = await User.findOneAndUpdate({ instagramId: user_id }, userData, { upsert: true, new: true });

    res.json(user);
  } catch (error) {
    console.error('Instagram Auth Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Instagram authentication failed' });
  }
};
