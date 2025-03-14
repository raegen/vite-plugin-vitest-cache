import { describe, expect, it } from 'vitest';


describe('fails 1', () => {
  it('should pass fail', async () => {
    expect(true).toBe(true);
  });
  it('should fail 1', async () => {
    expect(true).toBe(false);
  });
});
