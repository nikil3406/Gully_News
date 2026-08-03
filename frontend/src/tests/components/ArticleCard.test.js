import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ArticleCard from '../../components/ArticleCard';
import * as postService from '../../services/postService';

jest.mock('../../services/postService', () => ({
  toggleLikePost: jest.fn(),
}));

describe('ArticleCard', () => {
  test('renders the article title and supports liking', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'fake-token');
    postService.toggleLikePost.mockResolvedValue({ liked: true, likes_count: 11 });

    render(
      <MemoryRouter>
        <ArticleCard
          article={{
            id: 1,
            title: 'Local festival announced',
            content: 'A great event is coming to town',
            category: 'Sports',
            author: 'Asha',
            created_at: '2024-01-01T00:00:00Z',
            likes_count: 10,
            views_count: 5,
          }}
          currentUserId={2}
          onDelete={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/local festival announced/i)).toBeInTheDocument();
    const likeButton = screen.getByRole('button', { name: /10/i });
    await user.click(likeButton);
    expect(postService.toggleLikePost).toHaveBeenCalledWith(1);
  });
});
