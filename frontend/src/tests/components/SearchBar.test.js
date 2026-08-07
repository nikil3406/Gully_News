import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../../components/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('calls onSearch after the debounce delay', () => {
    const onSearch = jest.fn();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search news, topics/i);
    fireEvent.change(input, { target: { value: 'traffic' } });

    expect(onSearch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledWith('traffic');
  });

  test('renders as a search landmark without using a form that can reload the page', () => {
    const { container } = render(<SearchBar onSearch={jest.fn()} />);

    expect(container.querySelector('form')).toBeNull();
    expect(container.querySelector('[role="search"]')).not.toBeNull();
  });
});
