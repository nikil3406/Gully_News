import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

router.post('/image', verifyToken, (req, res) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
      const folder = req.query.folder || 'gully_news';
      const result = await uploadToCloudinary(req.file.buffer, folder, req.file.mimetype);
      return res.status(200).json({
        message: result.isFallback 
          ? 'Image processed (Data URL fallback - configure Cloudinary keys in backend/.env for hosted uploads)'
          : 'Image uploaded successfully to Cloudinary',
        url: result.url,
        public_id: result.public_id,
        isFallback: result.isFallback || false
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({
        error: uploadError.message || 'Failed to upload image to Cloudinary'
      });
    }
  });
});

export default router;
