import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { PolicyViewerModal } from '../policy-viewer-modal';

describe('PolicyViewerModal', () => {
  it('renders Privacy Policy content when policy="privacy"', () => {
    render(
      <PolicyViewerModal open={true} onClose={() => {}} policy="privacy" />,
    );
    // Dialog title (h2 from primitive) + body heading both exist; the
    // body heading is the verbatim string from the bible PrivacyPolicyContent.
    expect(screen.getByText(/HotSeaters Privacy Policy/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /prometheusags\.ai\/privacy/i }),
    ).toBeInTheDocument();
  });

  it('renders Terms of Service content when policy="terms"', () => {
    render(
      <PolicyViewerModal open={true} onClose={() => {}} policy="terms" />,
    );
    expect(
      screen.getByText(/HotSeaters Terms of Service/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /prometheusags\.ai\/terms/i }),
    ).toBeInTheDocument();
  });

  it('does not render content when open=false', () => {
    render(
      <PolicyViewerModal open={false} onClose={() => {}} policy="privacy" />,
    );
    expect(
      screen.queryByText(/HotSeaters Privacy Policy/i),
    ).not.toBeInTheDocument();
  });

  it('calls onClose when the dialog close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <PolicyViewerModal open={true} onClose={onClose} policy="privacy" />,
    );
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
