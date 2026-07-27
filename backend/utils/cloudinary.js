import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a buffer to Cloudinary using upload_stream.
 * Falls back to base64 Data URL if Cloudinary keys are not yet provided in .env.
 * @param {Buffer} fileBuffer - The memory buffer of the uploaded file.
 * @param {string} folder - Folder name in Cloudinary.
 * @param {string} mimeType - File mimetype (e.g. image/png).
 * @returns {Promise<{url: string, public_id: string, isFallback?: boolean}>}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'gully_news', mimeType = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if Cloudinary keys are configured in backend/.env
    if (!cloudName || !apiKey || !apiSecret || cloudName === 'your_cloud_name') {
      console.warn('⚠️ Cloudinary keys not configured in backend/.env. Using Base64 Data URL fallback for local testing.');
      const base64Image = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      return resolve({
        url: dataUrl,
        public_id: `fallback_${Date.now()}`,
        isFallback: true
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
