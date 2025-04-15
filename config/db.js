const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log("MONGO_URI>>> ", process.env.MONGO_URI)
    if (!uri) {
      throw new Error('MONGO_URI is undefined. Check your .env file.');
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
