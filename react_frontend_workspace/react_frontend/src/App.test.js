/**
 * UI/UX and routing has been completely updated for the new Task Manager front end.
 * Tests need rewriting to reflect the new screens and navigation; this file may be ignored or adapted.
 */
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login form', () => {
  render(<App />);
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});
