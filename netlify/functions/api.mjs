import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http';
import * as cheerio from 'cheerio';

// Import models
import '../../server/src/models/User.js';
import '../../server/src/models/Lead.js';
import '../../server/src/models/Call.js';
import '../../server/src/models/Meeting.js';
import '../../server/src/models/Activity.js';
import '../../server/src/models/Settings.js';

// Import routes
import authRouter from '../../server/src/routes/auth.js';
import leadsRouter from '../../server/src/routes/leads.js';
import callsRouter from '../../server/src/routes/calls.js';
import meetingsRouter from '../../server/src/routes/meetings.js';
import usersRouter from '../../server/src/routes/users.js';
import activitiesRouter from '../../server/src/routes/activities.js';
import settingsRouter from '../../server/src/routes/settings.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes — mounted at root because Netlify redirects /api/* → /.netlify/functions/api/*
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/calls', callsRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/settings', settingsRouter);

// Save scraped leads endpoint (extracted from scrape route to avoid puppeteer dependency)
const Lead = mongoose.model('Lead');
app.post('/api/scrape/save', async (req, res) => {
  try {
    const { leads: leadsData, assignTo } = req.body;
    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return res.status(400).json({ error: 'leads array is required' });
    }

    let success = 0;
    let failed = 0;
    let duplicates = 0;
    let noPhone = 0;
    const created = [];

    for (const data of leadsData) {
      if (!data.company_name) { failed++; continue; }
      if (!data.phone) { noPhone++; continue; }

      try {
        const lead = await Lead.create({
          company_name: data.company_name,
          phone: String(data.phone).replace(/\s+/g, ''),
          email: data.email || '',
          website: data.website || '',
          industry: data.industry || 'غير محدد',
          city: data.city || 'غير محدد',
          source: data.source || 'gmaps',
          status: 'new',
          assigned_to: assignTo || '',
          notes: data.address ? `العنوان: ${data.address}` : '',
          rating: data.rating || 0,
        });
        created.push(lead);
        success++;
      } catch (err) {
        if (err.code === 11000) {
          duplicates++;
        } else {
          failed++;
        }
      }
    }

    res.status(201).json({ success, failed, duplicates, noPhone, leads: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google Maps search via HTTP (serverless-compatible, no puppeteer)
app.post('/api/scrape/gmaps/search', async (req, res) => {
  try {
    const { searchQuery, city, industry, area, comprehensive } = req.body;
    const selectedArea = area && area !== 'all' ? area : '';
    const baseTerm = searchQuery || `${industry || ''} في ${selectedArea || city || ''}`.trim();

    let queries = [baseTerm];
    if (comprehensive) {
      const term = industry || searchQuery || '';
      if (selectedArea) {
        queries = [
          baseTerm,
          `${term} ${selectedArea}`,
          `${term} في ${selectedArea} ${city || ''}`.trim(),
          `أفضل ${term} في ${selectedArea}`,
          `${term} بالقرب من ${selectedArea}`,
        ];
      } else if (city) {
        const areas = CITY_AREAS_SERVER[city] || [];
        queries = [baseTerm];
        for (const a of areas) {
          queries.push(`${term} في ${a}`);
        }
      }
      queries = [...new Set(queries.filter(q => q.trim()))];
    }

    const allResults = [];
    const seenNames = new Set();

    for (const query of queries) {
      try {
        const results = await scrapeGoogleLocalSearch(query);
        for (const biz of results) {
          const key = (biz.name || '').toLowerCase().trim();
          if (key && !seenNames.has(key)) {
            seenNames.add(key);
            allResults.push({
              company_name: biz.name,
              phone: (biz.phone || '').replace(/[\s\-]+/g, ''),
              email: '',
              website: biz.website || '',
              industry: industry || biz.category || '',
              city: selectedArea || city || '',
              source: 'gmaps',
              address: biz.address || '',
              rating: biz.rating || 0,
            });
          }
        }
      } catch (err) {
        console.error(`Scrape query "${query}" failed:`, err.message);
      }
    }

    // Check for existing leads in DB
    const existingPhones = new Set();
    const phones = allResults.filter(r => r.phone).map(r => r.phone);
    if (phones.length > 0) {
      const existing = await Lead.find({ phone: { $in: phones } }, 'phone');
      existing.forEach(e => existingPhones.add(e.phone));
    }

    const leads = allResults.map(r => ({
      ...r,
      alreadySaved: r.phone ? existingPhones.has(r.phone) : false,
      selected: r.phone ? !existingPhones.has(r.phone) : true,
    }));

    res.json({
      leads,
      total: leads.length,
      withPhone: leads.filter(l => l.phone).length,
      newLeads: leads.filter(l => !l.alreadySaved).length,
      alreadySaved: leads.filter(l => l.alreadySaved).length,
    });
  } catch (err) {
    console.error('[scrape/search] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SSE wrapper endpoint — returns results as SSE events for frontend compatibility
app.get('/api/scrape/gmaps/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const { searchQuery, city, industry, area, comprehensive: compStr } = req.query;
  const comprehensive = compStr === 'true';
  const selectedArea = area && area !== 'all' ? area : '';
  const baseTerm = searchQuery || `${industry || ''} في ${selectedArea || city || ''}`.trim();

  let queries = [baseTerm];
  if (comprehensive) {
    const term = industry || searchQuery || '';
    if (selectedArea) {
      queries = [baseTerm, `${term} ${selectedArea}`, `${term} في ${selectedArea} ${city || ''}`.trim(), `أفضل ${term} في ${selectedArea}`, `${term} بالقرب من ${selectedArea}`];
    } else if (city) {
      queries = [baseTerm, ...(CITY_AREAS_SERVER[city] || []).map(a => `${term} في ${a}`)];
    }
    queries = [...new Set(queries.filter(q => q.trim()))];
  }

  send('status', { message: comprehensive ? `بدء البحث الشامل — ${queries.length} استعلام` : 'جاري البحث...', totalQueries: queries.length });

  const allResults = [];
  const seenNames = new Set();
  let queriesCompleted = 0;

  for (const query of queries) {
    try {
      const results = await scrapeGoogleLocalSearch(query);
      const newLeads = [];
      for (const biz of results) {
        const key = (biz.name || '').toLowerCase().trim();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          const lead = {
            company_name: biz.name,
            phone: (biz.phone || '').replace(/[\s\-]+/g, ''),
            email: '',
            website: biz.website || '',
            industry: industry || biz.category || '',
            city: selectedArea || city || '',
            source: 'gmaps',
            address: biz.address || '',
            rating: biz.rating || 0,
          };
          allResults.push(lead);
          newLeads.push(lead);
        }
      }

      // Check duplicates for this batch
      const phones = newLeads.filter(l => l.phone).map(l => l.phone);
      const existingPhones = new Set();
      if (phones.length > 0) {
        const existing = await Lead.find({ phone: { $in: phones } }, 'phone');
        existing.forEach(e => existingPhones.add(e.phone));
      }
      const leadsWithStatus = newLeads.map(l => ({ ...l, alreadySaved: l.phone ? existingPhones.has(l.phone) : false }));
      if (leadsWithStatus.length > 0) {
        send('results', { leads: leadsWithStatus, areaStat: { query, found: results.length, new: leadsWithStatus.filter(l => !l.alreadySaved).length } });
      }
    } catch (err) {
      send('areaError', { query, error: err.message });
    }

    queriesCompleted++;
    if (queries.length > 1) {
      send('progress', { message: `${queriesCompleted}/${queries.length} — ${query}`, queryIndex: queriesCompleted, totalQueries: queries.length });
    }
  }

  // Check all duplicates
  const allPhones = allResults.filter(r => r.phone).map(r => r.phone);
  const existAll = new Set();
  if (allPhones.length > 0) {
    const ex = await Lead.find({ phone: { $in: allPhones } }, 'phone');
    ex.forEach(e => existAll.add(e.phone));
  }

  send('done', {
    total: allResults.length,
    totalScraped: allResults.length,
    withPhone: allResults.filter(r => r.phone).length,
    newLeads: allResults.filter(r => !existAll.has(r.phone)).length,
    alreadySaved: allResults.filter(r => existAll.has(r.phone)).length,
    queriesRun: queriesCompleted,
  });
  res.end();
});

// City areas for comprehensive search
const CITY_AREAS_SERVER = {
  'القاهرة': ['مدينة نصر','المعادي','الدقي','المهندسين','الزمالك','وسط البلد','مصر الجديدة','العباسية','شبرا','حلوان','التجمع الخامس','الرحاب','مدينتي','المقطم','عين شمس'],
  'الجيزة': ['الهرم','فيصل','6 اكتوبر','الشيخ زايد','حدائق الأهرام','العمرانية','إمبابة','الدقي','العجوزة','المنيب'],
  'الإسكندرية': ['سيدي جابر','سموحة','المنتزه','سيدي بشر','كليوباترا','رشدي','ستانلي','العصافرة','جليم','لوران','العجمي','المعمورة'],
  'المنصورة': ['المنصورة','ميت غمر','طلخا','دكرنس','أجا','السنبلاوين'],
  'طنطا': ['طنطا','المحلة الكبرى','كفر الزيات','زفتى','سمنود'],
  'الزقازيق': ['الزقازيق','بلبيس','العاشر من رمضان','أبو حماد','منيا القمح'],
};

// HTTP-based Google Maps scraper (no puppeteer)
async function scrapeGoogleLocalSearch(query) {
  const params = new URLSearchParams({ q: query, tbm: 'lcl', hl: 'ar', gl: 'eg' });
  const url = `https://www.google.com/search?${params}`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ar,en;q=0.9',
      'Accept-Encoding': 'identity',
    },
  });

  if (!resp.ok) throw new Error(`Google returned ${resp.status}`);
  const html = await resp.text();
  return parseLocalSearchHTML(html);
}

function parseLocalSearchHTML(html) {
  const $ = cheerio.load(html);
  const businesses = [];

  // Strategy 1: Parse each result card with data-cid
  $('[data-cid]').each((_, el) => {
    const $el = $(el);
    const biz = extractBizFromCard($, $el);
    if (biz && biz.name) businesses.push(biz);
  });

  // Strategy 2: Look for result containers with headings
  if (businesses.length === 0) {
    const containers = $('div').filter((_, el) => {
      const $e = $(el);
      return $e.find('[role="heading"]').length > 0 && $e.text().length > 20 && $e.text().length < 500;
    });
    containers.each((_, el) => {
      const $el = $(el);
      const name = $el.find('[role="heading"] span').first().text().trim() || $el.find('[role="heading"]').first().text().trim();
      if (name && name.length > 2 && name.length < 80) {
        const text = $el.text();
        const phoneMatch = text.match(/(?:0[12]\d[\s\-]?\d{3,4}[\s\-]?\d{3,4}|\+20[\s\-]?\d{2}[\s\-]?\d{3,4}[\s\-]?\d{3,4})/);
        const ratingMatch = text.match(/(\d\.\d)\s*/);
        businesses.push({
          name,
          phone: phoneMatch ? phoneMatch[0] : '',
          address: '',
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
          category: '',
          website: '',
        });
      }
    });
  }

  // Strategy 3: Brute-force text extraction for phone numbers + nearby names
  if (businesses.length === 0) {
    const bodyText = $('body').text();
    const segments = bodyText.split(/\n|\r/).filter(s => s.trim().length > 3);
    const phoneRegex = /(?:0[12]\d[\s\-]?\d{3,4}[\s\-]?\d{3,4}|\+20[\s\-]?\d{2}[\s\-]?\d{3,4}[\s\-]?\d{3,4})/g;
    let match;
    while ((match = phoneRegex.exec(bodyText)) !== null) {
      const before = bodyText.substring(Math.max(0, match.index - 120), match.index);
      const lines = before.split(/[·\n\r|]/).filter(s => s.trim().length > 2);
      const nameLine = lines[lines.length - 1]?.trim();
      if (nameLine && nameLine.length > 2 && nameLine.length < 80) {
        businesses.push({
          name: nameLine,
          phone: match[0],
          address: '',
          rating: 0,
          category: '',
          website: '',
        });
      }
    }
  }

  return businesses;
}

function extractBizFromCard($, $card) {
  // Name
  let name = $card.find('[role="heading"] span').first().text().trim()
    || $card.find('[role="heading"]').first().text().trim()
    || $card.find('a[href*="/maps/place/"]').attr('aria-label')?.trim()
    || '';
  if (!name) {
    const ariaLabel = $card.attr('aria-label') || $card.find('a').first().attr('aria-label') || '';
    if (ariaLabel && ariaLabel.length < 80) name = ariaLabel;
  }
  if (!name) return null;

  // Rating
  let rating = 0;
  $card.find('span').each((_, el) => {
    const t = $(el).text().trim();
    if (/^\d\.\d$/.test(t)) { const r = parseFloat(t); if (r >= 1 && r <= 5) rating = r; }
  });

  // Phone
  const cardText = $card.text();
  const phoneMatch = cardText.match(/(?:0[12]\d[\s\-]?\d{3,4}[\s\-]?\d{3,4}|\+20[\s\-]?\d{2}[\s\-]?\d{3,4}[\s\-]?\d{3,4})/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Address — text segments that look like addresses
  let address = '';
  let category = '';
  $card.find('span').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 5 && t.length < 100 && !t.match(/^\d\.\d/) && !t.includes('★') && !t.match(/^\(\d+\)$/)) {
      if (!category && t.length < 25) category = t;
      else if (!address && t.length > 10) address = t;
    }
  });

  // Website
  let website = '';
  $card.find('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http') && !href.includes('google.com') && !href.includes('gstatic')) {
      website = href;
    }
  });

  return { name, phone, address, rating, category, website };
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// MongoDB connection (reuse across invocations)
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    serverApi: { version: '1', strict: true, deprecationErrors: true },
  });
  isConnected = true;
}

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  return serverlessHandler(event, context);
};
