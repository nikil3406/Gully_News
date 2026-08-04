import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const postControllerMock = {
  createPost: jest.fn((req, res) => res.status(201).json({ id: 1, title: 'Hello' })),
  getPosts: jest.fn((req, res) => res.json({ posts: [] })),
  getPostById: jest.fn((req, res) => res.json({ id: 1 })),
  getCategories: jest.fn((req, res) => res.json([])),
  getNearbyPosts: jest.fn((req, res) => res.json({ posts: [] })),
  toggleLike: jest.fn((req, res) => res.json({ liked: true })),
  incrementView: jest.fn((req, res) => res.json({ ok: true })),
  deletePost: jest.fn((req, res) => res.json({ deleted: true })),
};

jest.unstable_mockModule('../controllers/postController.js', () => postControllerMock);
jest.unstable_mockModule('../controllers/commentController.js', () => ({
  getComments: jest.fn((req, res) => res.json([])),
  addComment: jest.fn((req, res) => res.status(201).json({ id: 1 })),
  deleteComment: jest.fn((req, res) => res.json({ deleted: true })),
}));
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  verifyToken: (req, res, next) => next(),
  optionalVerifyToken: (req, res, next) => next(),
}));

const { default: postRoutes } = await import('../routes/posts.js');

const app = express();
app.use(express.json());
app.use('/api/posts', postRoutes);

describe('Posts routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles the posts list route', async () => {
    const response = await request(app).get('/api/posts');
    expect(response.status).toBe(200);
  });

  test('handles the create-post route', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer fake-token')
      .send({ title: 'Test', content: 'Test content' });
    expect(response.status).toBe(201);
  });
});
