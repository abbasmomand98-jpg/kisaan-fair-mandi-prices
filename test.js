/* ---------------------------------------------------------------------------
 * test.js — Node smoke test for Kisaan's pure logic (logic.js) and data.
 * Run: node test.js
 * Exits non-zero on the first failure so CI/shell scripts catch problems.
 * -------------------------------------------------------------------------*/

const data = require('./data.js');
const K = require('./logic.js');

let passed = 0;
let failed = 0;

function ok(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    failed++;
    console.log('  ✗ FAIL: ' + name + ' — got ' + a + ', want ' + e);
  }
}

console.log('\n--- formatPKR ---');
ok('5000 → ₨ 5,000', K.formatPKR(5000), '₨ 5,000');
ok('0 → ₨ 0', K.formatPKR(0), '₨ 0');
ok('NaN → ₨ —', K.formatPKR(NaN), '₨ —');
ok('negative', K.formatPKR(-250), '-₨ 250');

console.log('\n--- parsePrice ---');
ok('"3,400" → 3400', K.parsePrice('3,400'), 3400);
ok('empty → null', K.parsePrice(''), null);
ok('"abc" → null', K.parsePrice('abc'), null);
ok('"-5" → null', K.parsePrice('-5'), null);
ok('"0" → 0', K.parsePrice('0'), 0);

console.log('\n--- trendChange ---');
const wheat = K.cropById(data.CROPS, 'wheat');
ok('wheat diff +180, up', K.trendChange(wheat.trend), { diff: 180, up: true });
const basmati = K.cropById(data.CROPS, 'basmati');
ok('basmati diff -300, down', K.trendChange(basmati.trend), { diff: -300, up: false });
ok('short array safe', K.trendChange([5]), { diff: 0, up: true });

console.log('\n--- munsifVerdict ---');
ok('3400 vs 3900 ×25 → underpaid, loss 12500',
  K.munsifVerdict(3400, 3900, 25), { band: 'underpaid', diff: -500, loss: 12500 });
ok('3900 vs 3900 → fair, no loss',
  K.munsifVerdict(3900, 3900, 25), { band: 'fair', diff: 0, loss: 0 });
ok('4200 vs 3900 → good',
  K.munsifVerdict(4200, 3900, 10), { band: 'good', diff: 300, loss: 0 });
ok('boundary -150 → fair', K.munsifVerdict(3750, 3900, 25).band, 'fair');
ok('boundary -151 → underpaid', K.munsifVerdict(3749, 3900, 25).band, 'underpaid');
ok('boundary +151 → good', K.munsifVerdict(4051, 3900, 25).band, 'good');

console.log('\n--- sowingStatus (wheat, Punjab plains) ---');
const s1 = K.sowingStatus(data.SOWING, 'wheat', 'Punjab plains', new Date(2026, 9, 18));
ok('Oct 18 → upcoming', s1.status, 'upcoming');
ok('window labels', [s1.startLabel, s1.endLabel], ['25 Oct', '20 Nov']);
ok('7 days to window', s1.daysLeft, 7);
const s2 = K.sowingStatus(data.SOWING, 'wheat', 'Punjab plains', new Date(2026, 10, 1));
ok('Nov 1 → open', s2.status, 'open');
ok('day 8 of 27', [s2.dayIndex, s2.totalDays], [8, 27]);
ok('19 days left', s2.daysLeft, 19);
const s3 = K.sowingStatus(data.SOWING, 'wheat', 'Punjab plains', new Date(2026, 10, 18));
ok('Nov 18 → closing', s3.status, 'closing');
ok('2 days left', s3.daysLeft, 2);
const s4 = K.sowingStatus(data.SOWING, 'wheat', 'Punjab plains', new Date(2026, 11, 1));
ok('Dec 1 → rolls to next year, upcoming', s4.status, 'upcoming');
ok('varieties present', s2.varieties.includes('Dilkash-21'), true);
ok('unknown crop → null', K.sowingStatus(data.SOWING, 'nope', 'Punjab plains', new Date(2026, 9, 18)), null);
ok('unknown zone falls back to Punjab plains',
  K.sowingStatus(data.SOWING, 'wheat', 'Atlantis', new Date(2026, 10, 1)).status, 'open');

console.log('\n--- profitEstimate ---');
const p = K.profitEstimate(data.COSTS, 'wheat', 12, 35, 3900);
ok('cost per acre 47750', p.costPerAcre, 47750);
ok('revenue 1638000', p.revenue, 1638000);
ok('cost 573000', p.cost, 573000);
ok('profit 1065000', p.profit, 1065000);
ok('margin 65%', p.marginPct, 65);
ok('unknown crop → zero cost', K.profitEstimate(data.COSTS, 'nope', 5, 10, 1000).costPerAcre, 0);

console.log('\n--- firstRainDay ---');
ok('Okara first rain Wed', K.firstRainDay(data.WEATHER, 'Okara').day, 'Wed');
ok('Multan no rain → null', K.firstRainDay(data.WEATHER, 'Multan'), null);

console.log('\n--- cropById ---');
ok('wheat found', K.cropById(data.CROPS, 'wheat').name, 'Wheat');
ok('unknown → null', K.cropById(data.CROPS, 'xyz'), null);

console.log('\n--- data sanity ---');
ok('8 crops', data.CROPS.length, 8);
ok('every crop has a 7-day trend', data.CROPS.every((c) => c.trend.length === 7), true);
ok('every crop has mandi + positive rate',
  data.CROPS.every((c) => c.mandi && c.rate > 0), true);
ok('every sowing entry covers 3 zones',
  data.SOWING.every((s) => ['Punjab plains', 'Sindh', 'KPK'].every((z) => s.windows[z])), true);
ok('every district has 5 weather days',
  Object.values(data.WEATHER).every((w) => w.length === 5), true);
ok('every costed crop has a yield figure',
  Object.keys(data.COSTS).every((k) => data.YIELDS[k] > 0), true);

console.log('\n====================================');
console.log('PASSED: ' + passed + '   FAILED: ' + failed);
console.log('====================================\n');
process.exit(failed === 0 ? 0 : 1);
