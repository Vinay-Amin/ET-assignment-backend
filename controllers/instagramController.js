const axios = require('axios');
const User = require('../models/user');

exports.getInstagramAuthURL = (req, res) => {
  const authURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code`;
  res.json({ authURL });
  console.log("App ID:", process.env.INSTAGRAM_APP_ID);
  console.log("App Secret:", process.env.INSTAGRAM_APP_SECRET);
};


exports.instagramAuthCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Step 1: Exchange code for user access token
    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenRes.data;

    // Step 2: Get user profile to fetch user ID (and link to IG Business account)
    const meRes = await axios.get('https://graph.facebook.com/me', {
      params: { access_token }
    });
    console.log("Facebook /me response:", meRes.data); // 👀 Debug this

    const userId = meRes.data.id;

    // Step 3: Get connected pages
    // Step 3: Get connected pages
    const pagesRes = await axios.get(`https://graph.facebook.com/${userId}/accounts`, {
      params: { access_token }
    });
    console.log("Connected Pages:", pagesRes.data);

    const page = pagesRes.data.data?.[0];
    if (!page) {
      return res.status(400).json({
        error: 'No connected Facebook Page found. Make sure your account manages a page.'
      });
    }

    // Step 4: Get Instagram business account linked to that page
    const igRes = await axios.get(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account`,
      {
        params: { access_token: page.access_token }
      }
    );

    const instagramAccountId = igRes.data.instagram_business_account.id;

    // Step 5: Fetch IG profile info
    const profileRes = await axios.get(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,profile_picture_url,followers_count,media_count`,
      {
        params: { access_token: page.access_token }
      }
    );

    const profile = profileRes.data;

    // Save to DB
    const user = await User.findOneAndUpdate(
      { instagramId: instagramAccountId },
      {
        instagramId: instagramAccountId,
        username: profile.username,
        fullName: profile.username,
        profilePicture: profile.profile_picture_url,
        accessToken: page.access_token
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ user });

  } catch (err) {
    console.error('OAuth error:', err.response?.data || err.message);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
};