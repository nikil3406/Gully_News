import { extractPublicIdFromUrl, deleteFromCloudinary } from '../utils/cloudinary.js';

describe('Cloudinary Utility - Image Deletion', () => {
  test('extracts public_id correctly from standard Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1612345678/gully_news/sample_image.jpg';
    const publicId = extractPublicIdFromUrl(url);
    expect(publicId).toBe('gully_news/sample_image');
  });

  test('extracts public_id correctly from URL without version prefix', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/gully_news/folder/my_photo.png';
    const publicId = extractPublicIdFromUrl(url);
    expect(publicId).toBe('gully_news/folder/my_photo');
  });

  test('returns null for non-Cloudinary URLs (e.g. Bing / Data URL / null)', () => {
    expect(extractPublicIdFromUrl('https://www.bing.com/th/id/OIP.sample.jpg')).toBeNull();
    expect(extractPublicIdFromUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg...')).toBeNull();
    expect(extractPublicIdFromUrl(null)).toBeNull();
    expect(extractPublicIdFromUrl(undefined)).toBeNull();
  });

  test('deleteFromCloudinary gracefully returns null for non-Cloudinary image URLs', async () => {
    const result = await deleteFromCloudinary('https://www.bing.com/th/id/sample.jpg');
    expect(result).toBeNull();
  });
});
