/* ---------------------------------------------------------------------------
 * logic.js — Kisaan (pure logic, NO DOM code)
 *
 * Every function below takes plain values in and returns plain values out,
 * so the whole file runs in Node without a browser. Data arrays come from
 * data.js and are PASSED IN as arguments (never reached for as globals),
 * so the same functions run in the browser and under `node test.js`.
 * app.js calls these functions to power the UI; test.js covers them.
 * -------------------------------------------------------------------------*/

/**
 * Format a PKR amount: 5000 → "₨ 5,000". Non-numeric input → "₨ —".
 */
function formatPKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '₨ —';
  const grouped = String(Math.abs(Math.round(num))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (num < 0 ? '-₨ ' : '₨ ') + grouped;
}

/**
 * Parse a price field typed by the user. Empty / non-numeric / negative
 * → null so the UI can show one friendly error. 0 is a valid price.
 */
function parsePrice(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const n = Number(s.replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/**
 * 7-day change from a trend array: { diff, up }.
 * diff = last − first; up = diff >= 0.
 */
function trendChange(trend) {
  if (!Array.isArray(trend) || trend.length < 2) return { diff: 0, up: true };
  const diff = trend[trend.length - 1] - trend[0];
  return { diff, up: diff >= 0 };
}

/**
 * Munsif Meter verdict: is the middleman's offer fair against the mandi rate?
 * Bands (per 40 kg): underpaid < −150 · fair −150…+150 · good > +150.
 * Returns { band, diff, loss } where loss = money lost on `maunds` maunds
 * when underpaid (0 otherwise).
 */
function munsifVerdict(offer, mandiRate, maunds) {
  const diff = offer - mandiRate;
  let band = 'fair';
  if (diff < -150) band = 'underpaid';
  else if (diff > 150) band = 'good';
  const loss = band === 'underpaid' ? Math.abs(diff) * (maunds || 0) : 0;
  return { band, diff, loss };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtMD(year, m, d) {
  return d + ' ' + MONTHS[m - 1];
}

/**
 * Sowing-window status for a crop + zone on a given date.
 * `sowing` = the SOWING array from data.js; `today` is a Date (now if omitted).
 * Returns { startLabel, endLabel, totalDays, dayIndex, daysLeft, status }
 * where status ∈ 'upcoming' | 'open' | 'closing'.
 * (A passed window rolls forward to next year and reports 'upcoming'.)
 */
function sowingStatus(sowing, cropId, zone, today) {
  const entry = sowing.find((s) => s.cropId === cropId);
  if (!entry) return null;
  const win = entry.windows[zone] || entry.windows['Punjab plains'];
  const now = today instanceof Date ? today : new Date();
  let year = now.getFullYear();
  let start = new Date(year, win.start[0] - 1, win.start[1]);
  let end = new Date(year, win.end[0] - 1, win.end[1]);
  if (now > end) { // this year's window passed — look at next year
    year += 1;
    start = new Date(year, win.start[0] - 1, win.start[1]);
    end = new Date(year, win.end[0] - 1, win.end[1]);
  }
  const totalDays = Math.round((end - start) / 86400000) + 1;
  let status, dayIndex, daysLeft;
  if (now < start) {
    status = 'upcoming';
    dayIndex = 0;
    daysLeft = Math.round((start - now) / 86400000);
  } else {
    dayIndex = Math.round((now - start) / 86400000) + 1;
    daysLeft = Math.round((end - now) / 86400000);
    status = daysLeft <= 7 ? 'closing' : 'open';
  }
  return {
    startLabel: fmtMD(year, win.start[0], win.start[1]),
    endLabel: fmtMD(year, win.end[0], win.end[1]),
    totalDays, dayIndex, daysLeft, status,
    varieties: entry.varieties[zone] || entry.varieties['Punjab plains'],
    seedRate: entry.seedRate,
    tip: entry.tip
  };
}

/**
 * Profit estimate for one season.
 * `costs` = the COSTS map from data.js. yieldPerAcre = expected maunds
 * (40 kg) per acre; pricePer40kg = mandi rate.
 * Returns { revenue, cost, profit, costPerAcre, marginPct }.
 */
function profitEstimate(costs, cropId, acres, yieldPerAcre, pricePer40kg) {
  const rows = costs[cropId] || [];
  const costPerAcre = rows.reduce((t, r) => t + r.cost, 0);
  const revenue = acres * yieldPerAcre * pricePer40kg;
  const cost = acres * costPerAcre;
  const profit = revenue - cost;
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  return { revenue, cost, profit, costPerAcre, marginPct };
}

/**
 * First rainy day in a district's 5-day outlook (for the sowing alert).
 * `weather` = the WEATHER map from data.js. Returns the day object or null.
 */
function firstRainDay(weather, district) {
  const days = weather[district] || [];
  return days.find((d) => d.icon === 'rain') || null;
}

/**
 * Look up a crop by id in the CROPS array. Returns the object or null.
 */
function cropById(crops, id) {
  return crops.find((c) => c.id === id) || null;
}

/* One namespace export: works as a browser global AND a Node module. */
const Kisaan = {
  formatPKR,
  parsePrice,
  trendChange,
  munsifVerdict,
  sowingStatus,
  profitEstimate,
  firstRainDay,
  cropById
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Kisaan;
}
