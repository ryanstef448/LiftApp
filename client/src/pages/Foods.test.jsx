import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Nutrition from './Nutrition';

describe('Nutrition Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/foods')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/api/logs')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              date: '2026-09-15',
              entries: [],
              totals: { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders the main Nutrition Tracker heading and sub-tabs', async () => {
    render(<Nutrition />);
    await waitFor(() => {
      expect(screen.getByText(/Nutrition Tracker/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily Food Log/i)).toBeInTheDocument();
      expect(screen.getByText(/Known Meals Library/i)).toBeInTheDocument();
      expect(screen.getByText(/Stats & Visualizations/i)).toBeInTheDocument();
    });
  });

  it('renders daily macro summary cards', async () => {
    render(<Nutrition />);
    await waitFor(() => {
      expect(screen.getByText(/Total Calories/i)).toBeInTheDocument();
      expect(screen.getByText(/Protein/i)).toBeInTheDocument();
      expect(screen.getByText(/Carbs/i)).toBeInTheDocument();
      expect(screen.getByText(/Fats/i)).toBeInTheDocument();
    });
  });
});
