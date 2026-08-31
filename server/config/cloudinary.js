// Configures the Cloudinary SDK once, using the three values from your
// .env file (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).
// Every other file that needs to upload a photo just does
// `const cloudinary = require('../config/cloudinary')` and calls it --
// this is the ONLY place those three secrets get read.
//
// db.js runs `require('dotenv').config()` and is required (directly or
// indirectly) before this file anywhere it's used, so process.env is
// already populated by the time this runs.
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
