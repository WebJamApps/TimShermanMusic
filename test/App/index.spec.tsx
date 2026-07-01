import { render, screen } from '@testing-library/react';
import { App } from 'src/App';

describe('App', () => {
  it('renders the Tim Sherman Music heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Tim Sherman Music' })).toBeInTheDocument();
  });
});
