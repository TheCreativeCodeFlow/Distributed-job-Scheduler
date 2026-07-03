import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button UI Component', () => {
  it('triggers click handlers on click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Trigger Action</Button>);
    fireEvent.click(screen.getByText('Trigger Action'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('blocks clicks and presents spinner on loading state', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Button onClick={handleClick} loading>
        Submit
      </Button>,
    );
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
