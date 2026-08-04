import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const authServiceMock = {
  findUserByEmailOrUsername: jest.fn(),
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  saveRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
  verifyRefreshTokenInDb: jest.fn(),
  getUserDetails: jest.fn(),
  getUserPosts: jest.fn(),
  checkUserTaken: jest.fn(),
  updateUserProfile: jest.fn(),
  toggleFollow: jest.fn(),
  searchUsersInDb: jest.fn(),
  checkIsFollowing: jest.fn(),
};

jest.unstable_mockModule('../services/authService.js', () => authServiceMock);

const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn(),
};

jest.unstable_mockModule('bcrypt', () => ({
  default: bcryptMock,
  ...bcryptMock,
}));

const { default: authRoutes } = await import('../routes/auth.js');
const authService = await import('../services/authService.js');
const bcrypt = (await import('bcrypt')).default;

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers a user', async () => {
    authService.findUserByEmailOrUsername.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    authService.createUser.mockResolvedValue({ id: 1, username: 'demo', email: 'demo@test.com' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'demo', email: 'demo@test.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('demo');
  });

  test('rejects invalid login', async () => {
    authService.findUserByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@test.com', password: 'x' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid credentials');
  });
});
