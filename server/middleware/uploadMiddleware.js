// multer handles reading a file out of a multipart/form-data request (the
// format a <form> sends when it includes a file, instead of the plain JSON
// our other routes use). memoryStorage() means the uploaded file is kept as
// a Buffer in RAM (req.file.buffer) rather than saved to disk on our own
// server -- we don't want a local copy at all, just enough to hand off to
// Cloudinary, which is the one actually storing it long-term.
const multer = require('multer');
const path = require('path');

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB -- generous for a phone photo, small enough to reject something wildly oversized
  },
  fileFilter(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const hasAllowedMimeType = allowedMimeTypes.includes(file.mimetype);
    const hasAllowedExtension = allowedExtensions.includes(extension);

    // Some clients (Postman included, depending on exactly how a file was
    // picked) don't always attach a proper image MIME type -- they fall
    // back to the generic "application/octet-stream" label instead. Rather
    // than trust that label alone, we also accept a recognized file
    // extension as a backup check, and only reject when NEITHER looks like
    // a real image.
    if (!hasAllowedMimeType && !hasAllowedExtension) {
      return cb(new Error('Only JPEG, PNG, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

// `upload.single('photo')` means: look for ONE file on the field named
// "photo" in the incoming form data. Anything else in the same form
// (title, category, etc.) still lands in req.body as usual.
module.exports = upload.single('photo');
