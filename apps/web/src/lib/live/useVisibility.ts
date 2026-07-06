import React from 'react';
import { LiveContext } from './LiveContext';

export function useVisibility() {
  const context = React.useContext(LiveContext);
  if (!context) {
    return true; // graceful fallback for isolated components/tests
  }
  return context.isVisible;
}
