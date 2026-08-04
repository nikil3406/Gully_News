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

/**
 * Extracts the public_id from a Cloudinary image URL.
 * e.g. "https://res.cloudinary.com/cloudname/image/upload/v12345/gully_news/sample.jpg" -> "gully_news/sample"
 * @param {string} url
 * @returns {string|null}
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    let pathAfterUpload = parts[1].split('?')[0];
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }

    return pathAfterUpload || null;
  } catch (err) {
    console.error('Error extracting Cloudinary public_id:', err);
    return null;
  }
};

/**
 * Deletes an image from Cloudinary using its URL.
 * Safe fallback if keys are missing or URL is non-Cloudinary.
 * @param {string} imageUrl
 * @returns {Promise<{result: string}|null>}
 */
export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return null;

  const publicId = extractPublicIdFromUrl(imageUrl);
  if (!publicId) return null;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName === 'your_cloud_name') {
    console.warn('⚠️ Cloudinary keys not configured. Skipping image deletion from Cloudinary.');
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary image deleted (${publicId}):`, result);
    return result;
  } catch (error) {
    console.error(`Error deleting image from Cloudinary (${publicId}):`, error);
    return null;
  }
};

export default cloudinary;

