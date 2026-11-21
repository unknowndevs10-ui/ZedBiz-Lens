// All data in this file is SYNTHETIC. Business names, people and figures are invented.
import { addDays, toISODate } from '../utils/format';

export const INCOME_CATEGORIES = ['Sales', 'Services', 'Other income'];
export const EXPENSE_CATEGORIES = [
  'Stock purchases',
  'Transport',
  'Rent',
  'Utilities',
  'Wages',
  'Market fees',
  'Other expenses',
];

export const BUSINESSES = [
  {
    id: 'retail',
    name: 'Kabwe Road Mini-Mart',
    kind: 'Formal small retail shop',
    businessFormality: 'registered',
    scenario: 'formal_shop',
    location: 'Lusaka',
    summary: 'Groceries and household goods with weekly wholesale restocking.',
  },
  {
    id: 'salon',
    name: 'Glow Hair Studio',
    kind: 'Small service business',
    businessFormality: 'formalizing',
    scenario: 'service_microbusiness',
    location: 'Kitwe',
    summary: 'Braiding and styling with regular product purchases.',
  },
  {
    id: 'market',
    name: 'Soweto Stall 14',
    kind: 'Informal tomato and produce trader',
    businessFormality: 'informal',
    scenario: 'tomato_trader',
    location: 'Lusaka',
    summary: 'Tomatoes and fresh produce bought in small lots and sold daily, with market fees and transport costs.',
  },
  {
    id: 'solar-sme',
    name: 'Mosi Solar & Electrical Services',
    kind: 'Profitable private-sector SME',
    businessFormality: 'registered',
    scenario: 'private_sector_profit',
    location: 'Ndola',
    summary: 'A formal service firm with installation jobs, inventory, staff and recurring operating costs.',
  },
];

// Recurring patterns used to generate 120 days of synthetic history.
const RULES = {
  retail: [
    { type: 'income', category: 'Sales', description: ['Daily shop sales', 'End-of-day sales'], range: [900, 2400], every: 'daily', p: 0.95, step: 5 },
    { type: 'expense', category: 'Stock purchases', description: 'Wholesale restock', range: [5200, 8200], every: 'weekly', dow: 1 },
    { type: 'expense', category: 'Transport', description: 'Delivery transport', range: [120, 300], every: 'weekly', dow: 3 },
    { type: 'expense', category: 'Rent', description: 'Shop rent', range: [3000, 3000], every: 'monthly', dom: 1 },
    { type: 'expense', category: 'Utilities', description: 'Electricity tokens', range: [500, 900], every: 'monthly', dom: 12 },
    { type: 'expense', category: 'Wages', description: 'Shop assistant wages', range: [2400, 2400], every: 'monthly', dom: 28 },
  ],
  salon: [
    { type: 'income', category: 'Services', description: ['Braiding and styling', 'Hair treatment clients', 'Weave installation'], range: [250, 950], every: 'daily', p: 0.9, skipDow: [0] },
    { type: 'expense', category: 'Stock purchases', description: 'Hair products and extensions', range: [350, 900], every: 'weekly', dow: 2 },
    { type: 'expense', category: 'Rent', description: 'Salon rent', range: [1800, 1800], every: 'monthly', dom: 1 },
    { type: 'expense', category: 'Utilities', description: 'Electricity and water', range: [300, 500], every: 'monthly', dom: 15 },
    { type: 'expense', category: 'Wages', description: 'Assistant stylist wages', range: [3000, 3000], every: 'monthly', dom: 28 },
  ],
  market: [
    { type: 'income', category: 'Sales', description: ['Produce sales', 'Tomatoes and vegetables sold', 'Market day sales'], range: [350, 1100], every: 'daily', p: 0.92, step: 5 },
    { type: 'expense', category: 'Stock purchases', description: 'Produce from farm gate', range: [900, 1600], every: 'weekly', dow: [2, 5] },
    { type: 'expense', category: 'Transport', description: 'Bus fare and carrying', range: [60, 150], every: 'weekly', dow: [1, 3, 5], step: 5 },
    { type: 'expense', category: 'Market fees', description: 'Daily market levy', range: [20, 40], every: 'daily', p: 0.85, step: 5 },
  ],
  'solar-sme': [
    { type: 'income', category: 'Services', description: ['Solar installation job', 'Electrical repair and call-out', 'Solar maintenance contract'], range: [5500, 11500], every: 'weekly', dow: [1, 3, 5], step: 50 },
    { type: 'expense', category: 'Stock purchases', description: 'Panels, batteries and electrical supplies', range: [9000, 14000], every: 'weekly', dow: 2, step: 100 },
    { type: 'expense', category: 'Transport', description: 'Fuel and site transport', range: [450, 850], every: 'weekly', dow: [1, 3, 5], step: 50 },
    { type: 'expense', category: 'Rent', description: 'Workshop and office rent', range: [6000, 6000], every: 'monthly', dom: 1 },
    { type: 'expense', category: 'Utilities', description: 'Workshop electricity and data', range: [1500, 2500], every: 'monthly', dom: 12, step: 100 },
    { type: 'expense', category: 'Wages', description: 'Technician and installer wages', range: [12000, 12000], every: 'monthly', dom: 28 },
  ],
};

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic synthetic history ending today. Same business => same shape of data. */
export function generateSeedTransactions(business, days = 120) {
  const rng = mulberry32(hashString(business.id));
  const rules = RULES[business.id] || [];
  const today = toISODate(new Date());
  const transactions = [];
  let counter = 0;

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const day = new Date(`${date}T12:00:00`);
    const dow = day.getDay();
    const dom = day.getDate();

    for (const rule of rules) {
      let hit = false;
      if (rule.every === 'daily') hit = !(rule.skipDow || []).includes(dow) && rng() < (rule.p ?? 1);
      if (rule.every === 'weekly') hit = [].concat(rule.dow).includes(dow);
      if (rule.every === 'monthly') hit = dom === rule.dom;
      if (!hit) continue;

      const step = rule.step || 10;
      const [min, max] = rule.range;
      const amount = Math.max(step, Math.round((min + rng() * (max - min)) / step) * step);
      const description = Array.isArray(rule.description)
        ? rule.description[Math.floor(rng() * rule.description.length)]
        : rule.description;

      counter += 1;
      transactions.push({
        id: `${business.id}-seed-${counter}`,
        businessId: business.id,
        status: 'confirmed',
        type: rule.type,
        category: rule.category,
        description,
        amount,
        date,
        confidence: null,
        entryId: null,
        source: null,
        synthetic: true,
        createdAt: `${date}T08:00:00.000Z`,
      });
    }
  }
  return transactions;
}

