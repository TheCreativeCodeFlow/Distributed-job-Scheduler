import React from 'react';
import { LiveContext } from './LiveContext';

export function useNow() {
  const context = React.useContext(LiveContext);
  if (!context) {
    return new Date(); // graceful fallback for isolated components/tests
  }
  return context.now;
}
