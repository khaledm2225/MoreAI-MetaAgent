import { describe, expect, it } from 'vitest';
import { orderTimeline } from './timeline';

const states = (status: Parameters<typeof orderTimeline>[0]) => orderTimeline(status).map(({ status: step, state }) => `${step}:${state}`);

describe('orderTimeline', () => {
  it('shows the current step and what is left', () => {
    expect(states('ACCEPTED')).toEqual(['PLACED:done', 'ACCEPTED:current', 'OUT_FOR_DELIVERY:upcoming', 'DELIVERED:upcoming']);
  });

  it('finishes when delivered', () => {
    expect(states('DELIVERED')).toEqual(['PLACED:done', 'ACCEPTED:done', 'OUT_FOR_DELIVERY:done', 'DELIVERED:done']);
  });

  it('shows how far an order got before it ended badly', () => {
    expect(states('REJECTED')).toEqual(['PLACED:done', 'REJECTED:failed']);
    expect(states('NOT_DELIVERED')).toEqual(['PLACED:done', 'ACCEPTED:done', 'OUT_FOR_DELIVERY:done', 'NOT_DELIVERED:failed']);
  });
});
