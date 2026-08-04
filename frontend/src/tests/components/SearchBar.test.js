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
});
