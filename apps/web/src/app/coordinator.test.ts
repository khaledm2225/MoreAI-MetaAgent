import { describe, expect, it, vi } from 'vitest';
import { createAppCoordinator } from './coordinator';
import { routes } from './routes';

describe('createAppCoordinator', () => {
  it('goes back to the first screen', () => {
    const navigate = vi.fn();
    createAppCoordinator(navigate).showStart();
    expect(navigate).toHaveBeenCalledWith(routes.start);
  });

  it('fills in the address of one record, safely', () => {
    const navigate = vi.fn();
    const coordinator = createAppCoordinator(navigate);
    coordinator.showProduct('p 1');
    expect(navigate).toHaveBeenLastCalledWith('/client/products/p%201');
    coordinator.showRateOrder('o1');
    expect(navigate).toHaveBeenLastCalledWith('/client/orders/o1/rate');
  });

  it('has a working address for every destination', () => {
    const navigate = vi.fn();
    const coordinator = createAppCoordinator(navigate);
    for (const show of Object.values(coordinator) as ((id: string) => void)[]) {
      show('x');
    }
    expect(navigate.mock.calls.every(([path]) => typeof path === 'string' && path.startsWith('/') && !path.includes(':'))).toBe(true);
  });
});
