import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge UI Component', () => {
  it('renders children content correctly', () => {
    render(<Badge>Active status</Badge>);
    expect(screen.getByText('Active status')).toBeInTheDocument();
  });

  it('applies classes matching the variant parameter', () => {
    const { container } = render(<Badge variant="success">Completed</Badge>);
    expect(container.firstChild).toHaveClass('bg-emerald-500/10');
  });
});
