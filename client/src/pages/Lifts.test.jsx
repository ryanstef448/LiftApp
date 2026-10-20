import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Lifts from './Lifts';

describe('Lifts Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/progress')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 101, lift_id: 1, date: '2026-09-15', weight: 205, reps: 5, sets: 3, notes: 'Solid set' },
            ]),
        });
      }
      if (url.includes('/api/lifts')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, name: 'Barbell Bench Press', pr: 205, totalEntries: 5 },
              { id: 2, name: 'Barbell Back Squat', pr: 255, totalEntries: 4 },
            ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it('renders lifting tracking heading and movements', async () => {
    render(<Lifts />);
    await waitFor(() => {
      expect(screen.getByText(/Lifting Movements Tracking/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Barbell Bench Press/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Barbell Back Squat/i)).toBeInTheDocument();
    });
  });

  it('displays workout set form and pr badges', async () => {
    render(<Lifts />);
    await waitFor(() => {
      expect(screen.getByText(/Log Workout Set/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Workout Entry/i)).toBeInTheDocument();
    });
  });
});
