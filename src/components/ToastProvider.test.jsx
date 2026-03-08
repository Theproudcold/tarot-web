import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

const ToastHarness = () => {
  const { showToast } = useToast();

  return (
    <div>
      <button type="button" onClick={() => showToast({ message: 'All set.', tone: 'success' })}>
        Show Success
      </button>
      <button type="button" onClick={() => showToast({ message: 'Something went wrong.', tone: 'error' })}>
        Show Error
      </button>
    </div>
  );
};

describe('ToastProvider', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a success toast from context', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('All set.');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('replaces the current toast with an error toast', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show Error' }));

    expect(screen.getByRole('status')).toHaveTextContent('Something went wrong.');
  });
});
