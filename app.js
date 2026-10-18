/* ---------------------------------------------------------------------------
 * app.js — Kisaan UI layer
 *
 * Renders every view and wires every button. All business math comes from
 * logic.js (the Kisaan namespace); all content comes from data.js. This
 * file only touches the DOM.
 *
 * View map:
 *   view-home   → rabi banner, search, mandi price board
 *   view-meter  → Munsif Meter fair-price checker
 *   view-sowing → sowing window, weather, rain alert, checklist
 *   view-costs  → per-acre profit estimator
 * -------------------------------------------------------------------------*/

const LS_CHECKS = 'kisaan_checklist_v1';

const state = {
  query: '',
  meterCrop: 'wheat',
  sowingCrop: 'wheat',
  district: 'Okara',
  costCrop: 'wheat'
};

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Tiny SVG sparkline for a 7-day trend. */
function sparkSVG(trend, up) {
  const w = 96, h = 34, n = trend.length;
  const lo = Math.min.apply(null, trend), hi = Math.max.apply(null, trend);
  const span = (hi - lo) || 1;
  const pts = trend.map((v, i) =>
    (i * w / (n - 1)).toFixed(1) + ',' + (h - 3 - ((v - lo) / span) * (h - 6)).toFixed(1)
  ).join(' ');
  const col = up ? '#059669' : '#dc2626';
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
    '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/* ============ HOME — mandi board ============ */
function renderHome() {
  // Rabi banner: wheat window for the selected district's zone
  const dist = DISTRICTS.find((d) => d.name === state.district) || DISTRICTS[0];
  const st = Kisaan.sowingStatus(SOWING, 'wheat', dist.zone);
  const banner = document.getElementById('rabi-banner');
  if (st.status === 'upcoming') {
    banner.innerHTML =
      '<div class="banner-title">🌾 Rabi sowing window opens ' + esc(st.startLabel) + '</div>' +
      '<p>Wheat sowing in ' + esc(dist.zone) + ': ' + esc(st.startLabel) + ' – ' + esc(st.endLabel) +
      '. Get seed and DAP ready now.</p>' +
      '<button class="btn light" data-goto="view-sowing">Plan my sowing →</button>';
  } else {
    const left = st.status === 'closing' ? 'Only ' + st.daysLeft + ' days left!' : st.daysLeft + ' days left';
    banner.innerHTML =
      '<div class="banner-title">🌾 Rabi sowing window OPEN — ' + esc(left) + '</div>' +
      '<p>Wheat: ' + esc(st.startLabel) + ' – ' + esc(st.endLabel) + ' in ' + esc(dist.zone) +
      '. Late sowing after 20 Nov can cut yield by 15%.</p>' +
      '<button class="btn light" data-goto="view-sowing">Plan my sowing →</button>';
  }

  const q = state.query.trim().toLowerCase();
  const list = document.getElementById('crop-list');
  const rows = CROPS.filter((c) =>
    !q || c.name.toLowerCase().includes(q) || c.mandi.toLowerCase().includes(q) || c.urdu.includes(state.query.trim())
  );
  document.getElementById('crop-count').textContent =
    rows.length + ' crops · per 40 kg · updated 7:00 AM';
  list.innerHTML = rows.map((c) => {
    const t = Kisaan.trendChange(c.trend);
    const arrow = t.up ? '▲' : '▼';
    return '<div class="rate-row">' +
      '<div class="rate-icon">' + c.emoji + '</div>' +
      '<div class="rate-main"><strong>' + esc(c.name) + '</strong>' +
      '<div class="muted">' + esc(c.mandi) + '</div></div>' +
      sparkSVG(c.trend, t.up) +
      '<div class="rate-price"><strong>' + Kisaan.formatPKR(c.rate) + '</strong>' +
      '<div class="' + (t.up ? 'up' : 'down') + '">' + arrow + ' ' +
      Kisaan.formatPKR(Math.abs(t.diff)).replace('₨ ', '') + '</div></div>' +
      '</div>';
  }).join('') || '<div class="card"><p class="muted">No crops match your search.</p></div>';
}

/* ============ MUNSIF METER ============ */
function renderMeterVerdict() {
  const crop = Kisaan.cropById(CROPS, state.meterCrop);
  const offer = Kisaan.parsePrice(document.getElementById('meter-offer').value);
  const maunds = Kisaan.parsePrice(document.getElementById('meter-maunds').value) || 0;
  const err = document.getElementById('meter-error');
  const card = document.getElementById('meter-result-card');
  if (offer === null) {
    err.style.display = 'block';
    err.textContent = 'Please type the offer price in rupees (numbers only).';
    card.style.display = 'none';
    return;
  }
  err.style.display = 'none';
  const v = Kisaan.munsifVerdict(offer, crop.rate, maunds);
  const conf = {
    underpaid: { label: 'UNDERPAID', cls: 'bad',
      sub: Kisaan.formatPKR(Math.abs(v.diff)) + ' below today\u2019s ' + esc(crop.mandi) + ' rate' },
    fair: { label: 'FAIR PRICE', cls: 'ok',
      sub: 'Within ' + Kisaan.formatPKR(150) + ' of the mandi rate — reasonable' },
    good: { label: 'GOOD DEAL', cls: 'ok',
      sub: Kisaan.formatPKR(v.diff) + ' ABOVE the mandi rate — take it' }
  }[v.band];
  // meter bar: scale from mandi-1200 to mandi+1200
  const lo = crop.rate - 1200, hi = crop.rate + 1200;
  const pct = (x) => Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100));
  let html = '<div class="verdict-box ' + conf.cls + '"><div class="verdict-label">' +
    conf.label + '</div><div class="muted">' + conf.sub + '</div></div>';
  html += '<div class="meter-bar"><div class="meter-mandi" style="left:' + pct(crop.rate) + '%"></div>' +
    '<div class="meter-offer ' + conf.cls + '" style="left:' + pct(offer) + '%"></div></div>' +
    '<div class="meter-legend"><span>Offer: ' + Kisaan.formatPKR(offer) + '</span>' +
    '<span>Mandi: ' + Kisaan.formatPKR(crop.rate) + '</span></div>';
  if (v.band === 'underpaid' && maunds > 0) {
    html += '<div class="loss-box">On ' + maunds + ' maunds you\u2019d lose <strong>' +
      Kisaan.formatPKR(v.loss) + '</strong> to the middleman\u2019s margin.</div>';
  }
  html += '<div class="tips"><div class="tip">✓ Get 3 quotes before you sell</div>' +
    '<div class="tip">✓ Sell at the mandi gate rate, not the village rate</div></div>';
  document.getElementById('meter-verdict').innerHTML = html;
  document.getElementById('meter-range').textContent =
    crop.name + ' · today\u2019s ' + crop.mandi + ' rate: ' + Kisaan.formatPKR(crop.rate) + ' per 40 kg';
  card.style.display = 'block';
}

/* ============ SOWING PLANNER ============ */
function getChecks(key) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_CHECKS) || '{}');
    return all[key] || null;
  } catch (e) { return null; }
}
function setChecks(key, arr) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_CHECKS) || '{}');
    all[key] = arr;
    localStorage.setItem(LS_CHECKS, JSON.stringify(all));
  } catch (e) { /* storage unavailable — checklist just won't persist */ }
}

function renderSowing() {
  const dist = DISTRICTS.find((d) => d.name === state.district) || DISTRICTS[0];
  const st = Kisaan.sowingStatus(SOWING, state.sowingCrop, dist.zone);
  const crop = Kisaan.cropById(CROPS, state.sowingCrop);
  const body = document.getElementById('sowing-body');

  let statusLine;
  if (st.status === 'upcoming') {
    statusLine = '<span class="pill">Opens in ' + st.daysLeft + ' days</span>';
  } else if (st.status === 'closing') {
    statusLine = '<span class="pill warn">Closing — ' + st.daysLeft + ' days left!</span>';
  } else {
    statusLine = '<span class="pill ok">Open — day ' + st.dayIndex + ' of ' + st.totalDays + '</span>';
  }
  const frac = st.status === 'upcoming' ? 0 :
    Math.max(0.04, Math.min(1, st.dayIndex / st.totalDays));

  let html = '<div class="card"><div class="section-title">🌱 ' + esc(crop.name) +
    ' · ' + esc(state.district) + '</div>' +
    '<div class="big-date">' + esc(st.startLabel) + ' – ' + esc(st.endLabel) + '</div>' +
    '<div class="muted">Ideal sowing window · ' + esc(dist.zone) + '</div>' +
    '<div class="progress"><div class="progress-fill" style="width:' + Math.round(frac * 100) + '%"></div></div>' +
    '<div class="row-between"><strong>' + statusLine + '</strong>' +
    '<span class="muted">' + st.daysLeft + ' days left</span></div>' +
    '<div class="varieties"><strong>Recommended varieties:</strong> ' +
    st.varieties.map(esc).join(', ') + ' · <span class="muted">' + esc(st.seedRate) + '</span></div>' +
    '<p class="tip-text">💡 ' + esc(st.tip) + '</p></div>';

  // weather
  const days = WEATHER[state.district] || [];
  const icons = { sun: '☀️', rain: '🌧️', cloud: '⛅' };
  html += '<div class="section-title">🌤️ 5-day field weather</div><div class="weather-strip">' +
    days.map((d) => '<div class="wday"><div class="muted">' + esc(d.day) + '</div>' +
      '<div class="wicon">' + icons[d.icon] + '</div><strong>' + d.temp + '°</strong></div>').join('') +
    '</div>';
  const rain = Kisaan.firstRainDay(WEATHER, state.district);
  if (rain) {
    html += '<div class="alert-card">🌧️ <div><strong>Rain expected ' + esc(rain.day) +
      ' (' + rain.temp + '°)</strong><div class="muted">Finish sowing before the rain — wet fields delay germination.</div></div></div>';
  }

  // checklist
  const items = CHECKLISTS[state.sowingCrop] || [];
  const key = state.sowingCrop + '__' + state.district;
  let done = getChecks(key);
  if (!done || done.length !== items.length) { done = items.map(() => false); setChecks(key, done); }
  html += '<div class="section-title">✅ This week\u2019s checklist</div><div class="card">' +
    items.map((it, i) =>
      '<label class="check"><input type="checkbox" data-check="' + i + '"' +
      (done[i] ? ' checked' : '') + '><span>' + esc(it) + '</span></label>'
    ).join('') + '</div>';

  body.innerHTML = html;
  body.querySelectorAll('[data-check]').forEach((box) => {
    box.addEventListener('change', () => {
      const cur = getChecks(key) || items.map(() => false);
      cur[Number(box.getAttribute('data-check'))] = box.checked;
      setChecks(key, cur);
    });
  });
}

/* ============ COSTS / PROFIT ============ */
function renderCosts() {
  const acres = Math.max(0, Number(document.getElementById('cost-acres').value) || 0);
  const yieldIn = Number(document.getElementById('cost-yield').value);
  const crop = Kisaan.cropById(CROPS, state.costCrop);
  const yieldPerAcre = yieldIn > 0 ? yieldIn : (YIELDS[state.costCrop] || 30);
  const out = document.getElementById('costs-result');
  if (!acres) { out.innerHTML = ''; return; }
  const p = Kisaan.profitEstimate(COSTS, state.costCrop, acres, yieldPerAcre, crop.rate);
  const rows = (COSTS[state.costCrop] || []).map((r) =>
    '<div class="cost-row"><span>' + esc(r.item) + '</span><span>' + Kisaan.formatPKR(r.cost) + '</span></div>'
  ).join('');
  out.innerHTML = '<div class="card"><div class="section-title">💰 Season estimate — ' +
    esc(crop.name) + ', ' + acres + ' acre' + (acres === 1 ? '' : 's') + '</div>' +
    '<div class="money-grid">' +
    '<div class="money"><div class="muted">Revenue</div><strong>' + Kisaan.formatPKR(p.revenue) + '</strong></div>' +
    '<div class="money"><div class="muted">Total cost</div><strong>' + Kisaan.formatPKR(p.cost) + '</strong></div>' +
    '<div class="money good"><div class="muted">Profit</div><strong>' + Kisaan.formatPKR(p.profit) + '</strong></div>' +
    '<div class="money"><div class="muted">Margin</div><strong>' + p.marginPct + '%</strong></div></div>' +
    '<div class="muted" style="margin:10px 0 4px;">Cost per acre: ' + Kisaan.formatPKR(p.costPerAcre) +
    ' · yield assumed ' + yieldPerAcre + ' maunds/acre at ' + Kisaan.formatPKR(crop.rate) + '/40kg</div>' +
    '<div class="cost-rows">' + rows + '</div></div>';
}

/* ============ wiring ============ */
function fillSelect(id, items, val) {
  const el = document.getElementById(id);
  el.innerHTML = items.map((it) =>
    '<option value="' + esc(it.value) + '"' + (it.value === val ? ' selected' : '') + '>' + esc(it.label) + '</option>'
  ).join('');
}

function init() {
  // tab bar
  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      document.getElementById(t.getAttribute('data-view')).classList.add('active');
      window.scrollTo(0, 0);
    });
  });
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (!g) return;
    const v = g.getAttribute('data-goto');
    const tab = document.querySelector('.tab[data-view="' + v + '"]');
    if (tab) tab.click();
  });

  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderHome();
  });

  // meter
  fillSelect('meter-crop', CROPS.map((c) => ({ value: c.id, label: c.name + ' — ' + c.mandi })), state.meterCrop);
  document.getElementById('meter-crop').addEventListener('change', (e) => {
    state.meterCrop = e.target.value;
    document.getElementById('meter-result-card').style.display = 'none';
    document.getElementById('meter-range').textContent = '';
  });
  document.getElementById('meter-check').addEventListener('click', renderMeterVerdict);

  // sowing
  const sowable = SOWING.map((s) => s.cropId);
  fillSelect('sowing-crop', CROPS.filter((c) => sowable.includes(c.id))
    .map((c) => ({ value: c.id, label: c.name })), state.sowingCrop);
  fillSelect('sowing-district', DISTRICTS.map((d) => ({ value: d.name, label: d.name + ' · ' + d.zone })), state.district);
  document.getElementById('sowing-crop').addEventListener('change', (e) => {
    state.sowingCrop = e.target.value; renderSowing();
  });
  document.getElementById('sowing-district').addEventListener('change', (e) => {
    state.district = e.target.value; renderSowing(); renderHome();
  });

  // costs
  const costable = Object.keys(COSTS);
  fillSelect('cost-crop', CROPS.filter((c) => costable.includes(c.id))
    .map((c) => ({ value: c.id, label: c.name })), state.costCrop);
  document.getElementById('cost-crop').addEventListener('change', (e) => {
    state.costCrop = e.target.value;
    document.getElementById('cost-yield').value = YIELDS[state.costCrop] || '';
    renderCosts();
  });
  document.getElementById('cost-yield').value = YIELDS[state.costCrop];
  ['cost-acres', 'cost-yield'].forEach((id) =>
    document.getElementById(id).addEventListener('input', renderCosts));

  renderHome();
  renderSowing();
}

document.addEventListener('DOMContentLoaded', init);
