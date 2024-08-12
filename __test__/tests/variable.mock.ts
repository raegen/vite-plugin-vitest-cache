import { describe, expect, it } from 'vitest';
import { deep } from './deep';


describe('passes 2', () => {
  it('should pass', async () => {
    expect(deep).toBe(deep);
  });
});
