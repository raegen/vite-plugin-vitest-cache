import { describe, expect, it } from 'vitest';


describe('fails 1', () => {
  it('should pass', async () => {
    expect(true).toBe(true);
  });
  it('should fail', async () => {
    expect(true).toBe(false);
  });
});
