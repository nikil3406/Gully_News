import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilter from '../../components/CategoryFilter';

describe('CategoryFilter', () => {
  test('renders topics and calls the category callback when a category is selected', () => {
    const onCategorySelect = jest.fn();

    render(
      <CategoryFilter
        categories={[{ id: 2, name: 'Sports', color: '#f59e0b' }]}
        onCategorySelect={onCategorySelect}
        selectedCategory={null}
        trendingPosts={[
          { id: 10, title: 'Local festival', views_count: 8, likes_count: 3, created_at: '2024-01-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText(/browse topics/i)).toBeInTheDocument();
    expect(screen.getByText(/trending/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sports/i }));

    expect(onCategorySelect).toHaveBeenCalledWith(2);
  });
});
