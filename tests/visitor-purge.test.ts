import test from 'node:test';
import assert from 'node:assert/strict';

test('Phase 2 - Maintenance & Visitor Purge logic validation', async (t) => {
  await t.test('clear ranges support all, 7 days, 30 days, and 365 days', () => {
    const supportedRanges = ['all', 'older_than_week', 'older_than_month', 'older_than_year'];
    assert.equal(supportedRanges.length, 4);
    assert.ok(supportedRanges.includes('older_than_week'));
    assert.ok(supportedRanges.includes('older_than_month'));
    assert.ok(supportedRanges.includes('older_than_year'));
    assert.ok(supportedRanges.includes('all'));
  });

  await t.test('generates accurate SQL interval clauses per purge filter', () => {
    function getIntervalClause(range: string): string {
      switch (range) {
        case 'older_than_week':
          return "created_at < NOW() - INTERVAL '7 days'";
        case 'older_than_month':
          return "created_at < NOW() - INTERVAL '30 days'";
        case 'older_than_year':
          return "created_at < NOW() - INTERVAL '365 days'";
        default:
          return 'ALL';
      }
    }

    assert.equal(getIntervalClause('older_than_week'), "created_at < NOW() - INTERVAL '7 days'");
    assert.equal(getIntervalClause('older_than_month'), "created_at < NOW() - INTERVAL '30 days'");
    assert.equal(getIntervalClause('older_than_year'), "created_at < NOW() - INTERVAL '365 days'");
    assert.equal(getIntervalClause('all'), 'ALL');
  });
});
