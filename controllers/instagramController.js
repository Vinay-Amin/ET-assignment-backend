const axios = require('axios');
const User = require('../models/user');

exports.getInstagramAuthURL = (req, res) => {
  if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_REDIRECT_URI) {
    console.error('Missing required environment variables');
    return res.status(500).json({ error: 'Invalid configuration' });
  }

  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'instagram_manage_comments',
    'business_management' // Add this scope
  ].join(',');

  const authURL = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=${scopes}&response_type=code`;
  
  console.log('Auth URL:', authURL);
  res.redirect(authURL);
};


exports.instagramAuthCallback = async (req, res) => {
  console.log('Callback received:', {
    query: req.query,
    code: req.query.code?.substring(0, 10) + '...' // Log first 10 chars of code
  });

  const { code } = req.query;

  if (!code) {
    console.error('No code received in callback');
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

    console.log('Token response:', {
      success: !!tokenRes.data.access_token,
      tokenLength: tokenRes.data.access_token?.length
    });

    const { access_token } = tokenRes.data;
    console.log("✅ Access token:", access_token);

    // Debug token
    const debugToken = await axios.get('https://graph.facebook.com/debug_token', {
      params: {
        input_token: access_token,
        access_token: `${process.env.INSTAGRAM_APP_ID}|${process.env.INSTAGRAM_APP_SECRET}`
      }
    });
    console.log('Token debug info:', debugToken.data);

    // Step 2: Get user's Facebook ID
    const meRes = await axios.get('https://graph.facebook.com/me', {
      params: { 
        access_token,
        fields: 'id,name,accounts' // Add accounts field
      }
    });
    console.log('User details:', meRes.data);
    const userId = meRes.data.id;
    console.log("User ID:", userId);

    // Step 3: Get pages the user manages
    const pagesRes = await axios.get(`https://graph.facebook.com/${userId}/accounts`, {
      params: { 
        access_token,
        fields: 'id,name,access_token,instagram_business_account'  // Add fields
      }
    });

    console.log('Pages Response:', {
      status: pagesRes.status,
      data: pagesRes.data,
      pagesCount: pagesRes.data.data?.length || 0
    });

    const page = pagesRes.data.data?.[0];
    
    if (!page) {
      console.error('No Facebook Pages found. Full response:', pagesRes.data);
      return res.status(400).json({ 
        error: 'No Facebook Page found for this user.',
        details: 'Please ensure you have created a Facebook Page and are an admin.'
      });
    }

    // Step 4: Get Instagram Business ID from the page
    const igRes = await axios.get(`https://graph.facebook.com/v16.0/${page.id}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: page.access_token
      }
    });

    const instagramBusinessId = igRes.data.instagram_business_account?.id;
    console.log("Instagram Business ID:", instagramBusinessId);
    

    if (!instagramBusinessId) {
      return res.status(400).json({ error: 'No Instagram Business account linked to the Facebook Page.' });
    }

    // Step 5: Get Instagram profile info
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

    // Step 6: Save to DB
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

    // res.redirect('https://et-assignment-frontend.vercel.app/success');
    res.redirect('http://localhost:3000/success');
    console.log("User saved:", user);

  } catch (error) {
    console.error('Authentication error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.response?.data || error.message 
    });
  }
};