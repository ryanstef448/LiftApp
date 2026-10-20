import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock chart.js / react-chartjs-2 because jsdom does not implement HTML5 Canvas
vi.mock('react-chartjs-2', () => ({
  Line: () => React.createElement('div', { 'data-testid': 'mock-line-chart' }),
  Bar: () => React.createElement('div', { 'data-testid': 'mock-bar-chart' }),
}));

afterEach(() => {
  cleanup();
});
