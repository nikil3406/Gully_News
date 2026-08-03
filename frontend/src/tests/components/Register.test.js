import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';
import * as authService from '../../services/authService';

const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

jest.mock('../../services/authService', () => ({
  register: jest.fn(),
}));

describe('Register page', () => {
  afterEach(() => {
    mockAlert.mockClear();
  });
  test('renders the registration form', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('submits the form and shows success flow', async () => {
    const user = userEvent.setup();
    authService.register.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(authService.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123');
  });
});
