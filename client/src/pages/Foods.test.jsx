import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Foods from './Foods';

describe('Foods component', () => {
  it('renders the main heading', () => {
    render(<Foods />);
    const headingElement = screen.getByText(/Foods Tracking/i);
    expect(headingElement).toBeInTheDocument();
  });
});
