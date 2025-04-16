const axios = require('axios');
const User = require('../models/user');

exports.getInstagramAuthURL = (req, res) => {
  const authURL = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_metadata,instagram_manage_comments&response_type=code`;
  // res.json({ authURL });
  res.redirect(authURL);
  console.log("App ID:", process.env.INSTAGRAM_APP_ID);
  console.log("App Secret:", process.env.INSTAGRAM_APP_SECRET);
};


exports.instagramAuthCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Step 1: Get access token
    const tokenRes = await axios.get('https://graph.facebook.com/v16.0/oauth/access_token', {
      params: {
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenRes.data;
    console.log("✅ Access token:", access_token);

    // Step 2: HARDCODE Instagram Biz ID for now (you already confirmed it)
    const instagramBusinessId = '17841461048924589';

    // Step 3: Get Instagram profile info
    const profileRes = await axios.get(
      `https://graph.facebook.com/v16.0/${instagramBusinessId}`,
      {
        params: {
          fields: 'username,profile_picture_url,followers_count,media_count',
          access_token
        }
      }
    );

    const profile = profileRes.data;

    // Step 4: Save to DB
    const user = await User.findOneAndUpdate(
      { instagramId: instagramBusinessId },
      {
        instagramId: instagramBusinessId,
        username: profile.username,
        fullName: profile.username,
        profilePicture: profile.profile_picture_url,
        accessToken: access_token,
        isLoggedIn: true
      },
      { new: true, upsert: true }
    );


    // return res.status(200).json({ user });
    res.redirect('https://et-assignment-frontend.vercel.app/success');

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'OAuth callback failed' });
  }
};