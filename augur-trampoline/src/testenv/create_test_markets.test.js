// @flow

import create_test_markets from './create_test_markets';

test(
  'can create test markets',
  async () => {
    const result = await create_test_markets();
    expect(result).toBeTruthy();
  },
  20000,
);
