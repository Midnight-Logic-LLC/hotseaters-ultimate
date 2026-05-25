import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DollarSign } from 'lucide-react';
import { KpiTile } from '../kpi-tile';

describe('KpiTile', () => {
  it('renders title, value, and icon', () => {
    render(<KpiTile title="Revenue YTD" value="$12,345" icon={DollarSign} iconClass="h-4 w-4" />);
    expect(screen.getByText('Revenue YTD')).toBeTruthy();
    expect(screen.getByText('$12,345')).toBeTruthy();
  });

  it('renders skeleton bar when value is undefined', () => {
    render(<KpiTile title="Loading" value={undefined} icon={DollarSign} iconClass="h-4 w-4" />);
    expect(screen.getByLabelText('Loading loading')).toBeTruthy();
  });

  it('renders caption only when both value and caption are set', () => {
    const { rerender } = render(
      <KpiTile title="X" value="1" icon={DollarSign} iconClass="" caption="cap" />,
    );
    expect(screen.getByText('cap')).toBeTruthy();
    rerender(
      <KpiTile title="X" value={undefined} icon={DollarSign} iconClass="" caption="cap" />,
    );
    // caption hidden while loading (avoids stale caption next to skeleton)
    expect(screen.queryByText('cap')).toBeNull();
  });

  it('is keyboard-activatable when onClick is set', () => {
    const onClick = vi.fn();
    render(<KpiTile title="X" value="1" icon={DollarSign} iconClass="" onClick={onClick} />);
    const tile = screen.getByRole('button');
    fireEvent.keyDown(tile, { key: 'Enter' });
    fireEvent.keyDown(tile, { key: ' ' });
    fireEvent.keyDown(tile, { key: 'a' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('omits button role when no onClick', () => {
    render(<KpiTile title="X" value="1" icon={DollarSign} iconClass="" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('sets data-testid for harness selection', () => {
    render(
      <KpiTile title="X" value="1" icon={DollarSign} iconClass="" testId="kpi-x" />,
    );
    expect(document.querySelector('[data-testid="kpi-x"]')).not.toBeNull();
  });
});
