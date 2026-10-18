/* ---------------------------------------------------------------------------
 * data.js — Kisaan (Fair Crop Prices & Sowing Advisor)
 *
 * All content lives here: crops with their mandi rates (per 40 kg) and
 * 7-day trends, the sowing calendar per crop and zone, recommended seed
 * varieties, 5-day field weather per district, and per-acre cost tables.
 * Editing a price or adding a crop means editing ONLY this file —
 * logic.js and app.js never hard-code business facts.
 *
 * Notes on realism (demo data):
 *  - Prices are realistic PKR estimates for Oct 2026, the rabi sowing
 *    season. A real product would pull these from a daily mandi feed;
 *    here they are SAMPLE data so the UI, verdicts and maths are real.
 *  - Sowing windows follow Punjab/Sindh/KPK agronomy guidance for rabi
 *    crops (wheat, mustard, gram, potato, onion, berseem).
 * -------------------------------------------------------------------------*/

/* Districts shown in the selectors. */
const DISTRICTS = [
  { name: 'Okara',       zone: 'Punjab plains' },
  { name: 'Multan',      zone: 'Punjab plains' },
  { name: 'Faisalabad',  zone: 'Punjab plains' },
  { name: 'Sahiwal',     zone: 'Punjab plains' },
  { name: 'Gujranwala',  zone: 'Punjab plains' },
  { name: 'Peshawar',    zone: 'KPK' },
  { name: 'Hyderabad',   zone: 'Sindh' }
];

/* Crops: rate = today's mandi price per 40 kg; trend = last 7 days. */
const CROPS = [
  {
    id: 'wheat', name: 'Wheat', urdu: 'گندم', emoji: '🌾',
    mandi: 'Okara Mandi', rate: 3900,
    trend: [3720, 3760, 3750, 3810, 3780, 3840, 3900]
  },
  {
    id: 'basmati', name: 'Basmati Rice', urdu: 'باسمتی', emoji: '🍚',
    mandi: 'Gujranwala Mandi', rate: 8400,
    trend: [8700, 8620, 8650, 8540, 8490, 8510, 8400]
  },
  {
    id: 'cotton', name: 'Cotton', urdu: 'کپاس', emoji: '☁️',
    mandi: 'Multan Mandi', rate: 8650,
    trend: [8300, 8380, 8410, 8390, 8520, 8580, 8650]
  },
  {
    id: 'maize', name: 'Maize', urdu: 'مکئی', emoji: '🌽',
    mandi: 'Sahiwal Mandi', rate: 3100,
    trend: [3020, 3040, 3030, 3070, 3060, 3090, 3100]
  },
  {
    id: 'mustard', name: 'Mustard', urdu: 'رایا', emoji: '🌼',
    mandi: 'Multan Mandi', rate: 6200,
    trend: [6050, 6100, 6080, 6150, 6120, 6180, 6200]
  },
  {
    id: 'potato', name: 'Potato', urdu: 'آلو', emoji: '🥔',
    mandi: 'Okara Mandi', rate: 1800,
    trend: [1950, 1920, 1900, 1880, 1850, 1820, 1800]
  },
  {
    id: 'onion', name: 'Onion', urdu: 'پیاز', emoji: '🧅',
    mandi: 'Hyderabad Mandi', rate: 2400,
    trend: [2200, 2250, 2300, 2280, 2350, 2380, 2400]
  },
  {
    id: 'sugarcane', name: 'Sugarcane', urdu: 'گنا', emoji: '🎋',
    mandi: 'Faisalabad Mandi', rate: 420,
    trend: [400, 405, 410, 408, 415, 418, 420]
  }
];

/* Sowing calendar: month/day pairs per zone. Year rolls automatically. */
const SOWING = [
  {
    cropId: 'wheat',
    windows: {
      'Punjab plains': { start: [10, 25], end: [11, 20] },
      'Sindh':          { start: [11, 1],  end: [11, 25] },
      'KPK':            { start: [10, 15], end: [11, 10] }
    },
    varieties: {
      'Punjab plains': ['Dilkash-21', 'Akbar-19', 'Subhani'],
      'Sindh': ['TD-1', 'Benazir-13'],
      'KPK': ['Pirsabak-15', 'Shahkar-13']
    },
    seedRate: '50 kg per acre',
    tip: 'Sow between 25 Oct and 10 Nov for the best tillering — late sowing after 20 Nov can cut yield by 15%.'
  },
  {
    cropId: 'mustard',
    windows: {
      'Punjab plains': { start: [10, 1], end: [10, 31] },
      'Sindh':          { start: [10, 10], end: [11, 10] },
      'KPK':            { start: [9, 25],  end: [10, 20] }
    },
    varieties: {
      'Punjab plains': ['Super Raya', 'Canola-43'],
      'Sindh': ['S-9', 'Canola-43'],
      'KPK': ['Dunkled', 'Super Raya']
    },
    seedRate: '2 kg per acre',
    tip: 'Mustard must be in the ground before November — every late week costs oil content.'
  },
  {
    cropId: 'potato',
    windows: {
      'Punjab plains': { start: [10, 1], end: [10, 31] },
      'Sindh':          { start: [10, 15], end: [11, 15] },
      'KPK':            { start: [9, 20],  end: [10, 15] }
    },
    varieties: {
      'Punjab plains': ['Cardinal', 'Diamant', 'Sante'],
      'Sindh': ['Cardinal', 'Diamant'],
      'KPK': ['Desiree', 'Cardinal']
    },
    seedRate: '1,000–1,200 kg seed per acre',
    tip: 'Use certified seed — virus-infected seed is the #1 reason potato yields collapse.'
  },
  {
    cropId: 'onion',
    windows: {
      'Punjab plains': { start: [10, 15], end: [11, 30] },
      'Sindh':          { start: [10, 1],  end: [11, 15] },
      'KPK':            { start: [10, 1],  end: [10, 31] }
    },
    varieties: {
      'Punjab plains': ['Desi Red', 'Swat-1'],
      'Sindh': ['Nasar Puri', 'Desi Red'],
      'KPK': ['Swat-1', 'Desi Red']
    },
    seedRate: 'Nursery: 3–4 kg seed per acre of field',
    tip: 'Transplant 6–8 week old nursery seedlings — direct seeding gives uneven bulbs.'
  }
];

/* 5-day field weather per district (sample data). */
const WEATHER = {
  'Okara': [
    { day: 'Sun', icon: 'sun',  temp: 31 },
    { day: 'Mon', icon: 'sun',  temp: 30 },
    { day: 'Tue', icon: 'sun',  temp: 29 },
    { day: 'Wed', icon: 'rain', temp: 27 },
    { day: 'Thu', icon: 'rain', temp: 26 }
  ],
  'Multan': [
    { day: 'Sun', icon: 'sun',  temp: 33 },
    { day: 'Mon', icon: 'sun',  temp: 32 },
    { day: 'Tue', icon: 'sun',  temp: 31 },
    { day: 'Wed', icon: 'sun',  temp: 30 },
    { day: 'Thu', icon: 'cloud', temp: 29 }
  ],
  'Faisalabad': [
    { day: 'Sun', icon: 'sun',  temp: 31 },
    { day: 'Mon', icon: 'sun',  temp: 30 },
    { day: 'Tue', icon: 'cloud', temp: 29 },
    { day: 'Wed', icon: 'rain', temp: 27 },
    { day: 'Thu', icon: 'sun',  temp: 28 }
  ],
  'Peshawar': [
    { day: 'Sun', icon: 'sun',  temp: 29 },
    { day: 'Mon', icon: 'cloud', temp: 28 },
    { day: 'Tue', icon: 'rain', temp: 25 },
    { day: 'Wed', icon: 'rain', temp: 24 },
    { day: 'Thu', icon: 'sun',  temp: 26 }
  ],
  'Hyderabad': [
    { day: 'Sun', icon: 'sun',  temp: 35 },
    { day: 'Mon', icon: 'sun',  temp: 34 },
    { day: 'Tue', icon: 'sun',  temp: 34 },
    { day: 'Wed', icon: 'sun',  temp: 33 },
    { day: 'Thu', icon: 'cloud', temp: 32 }
  ]
};

/* Per-acre cost of cultivation (sample, wheat baseline; PKR). */
const COSTS = {
  wheat: [
    { item: 'Seed (Dilkash-21, 50 kg)', cost: 6500 },
    { item: 'DAP (1 bag at sowing)',    cost: 13500 },
    { item: 'Urea (1.5 bags)',          cost: 6750 },
    { item: 'Ploughing + diesel',       cost: 8000 },
    { item: 'Canal / tube-well water',  cost: 4000 },
    { item: 'Labour (sowing + harvest)', cost: 9000 }
  ],
  mustard: [
    { item: 'Seed (Super Raya, 2 kg)', cost: 2400 },
    { item: 'DAP (1 bag)',             cost: 13500 },
    { item: 'Urea (1 bag)',            cost: 4500 },
    { item: 'Ploughing + diesel',      cost: 7000 },
    { item: 'Water + labour',          cost: 8000 }
  ],
  potato: [
    { item: 'Certified seed (1,100 kg)', cost: 88000 },
    { item: 'DAP (2 bags)',              cost: 27000 },
    { item: 'Urea + potash',             cost: 12000 },
    { item: 'Ploughing + ridging',       cost: 10000 },
    { item: 'Water + labour',            cost: 15000 }
  ]
};

/* Expected yield in maunds (40 kg) per acre — for the profit estimator. */
const YIELDS = { wheat: 35, mustard: 22, potato: 220, onion: 180, maize: 60, basmati: 28, cotton: 25, sugarcane: 700 };

/* Pre-sowing checklists per crop (saved to localStorage when ticked). */
const CHECKLISTS = {
  wheat:   ['Seed: Dilkash-21, 50 kg/acre', 'DAP: 1 bag/acre at sowing', 'Laser-level the field', 'Arrange canal water turn'],
  mustard: ['Seed: Super Raya, 2 kg/acre', 'DAP: 1 bag/acre', 'Prepare a fine seedbed', 'Book the thresher early'],
  potato:  ['Certified seed: Cardinal / Diamant', 'DAP: 2 bags/acre', 'Ridges 75 cm apart', 'Book cold-storage space'],
  onion:   ['Nursery: 3–4 kg seed per acre', 'Transplant at 6–8 weeks', 'DAP at transplanting', 'Plan irrigation turns']
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DISTRICTS, CROPS, SOWING, WEATHER, COSTS, YIELDS, CHECKLISTS };
}
