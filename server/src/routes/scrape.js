import { Router } from 'express';
import Lead from '../models/Lead.js';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const router = Router();

// ============================================================
// Google Maps — direct scrape via headless browser (no API key)
// Supports single query or multi-query comprehensive search
// ============================================================

// City neighborhoods for comprehensive area-based search
const CITY_AREAS = {
  'القاهرة': [
    'مدينة نصر', 'المعادي', 'الدقي', 'المهندسين', 'الزمالك', 'وسط البلد',
    'مصر الجديدة', 'العباسية', 'شبرا', 'حلوان', 'التجمع الخامس', 'الرحاب',
    'مدينتي', 'المقطم', 'عين شمس', 'النزهة', 'السيدة زينب', 'الدرب الاحمر',
    'حدائق القبة', 'المرج', 'الشروق', 'بدر', 'العبور', 'الزيتون',
    'روض الفرج', 'المطرية', 'بولاق', 'الوايلي', 'حدائق المعادي',
    'دار السلام', 'طره', 'المعصرة', 'التبين', 'الخليفة',
    'منشية ناصر', 'الساحل', 'شبرا الخيمة', 'الموسكي', 'الأزهر',
    'جاردن سيتي', 'المنيل', 'الشيخ زايد', 'القطامية',
  ],
  'الجيزة': [
    'الهرم', 'فيصل', '6 اكتوبر', 'الشيخ زايد', 'حدائق الأهرام', 'العمرانية',
    'الحوامدية', 'البدرشين', 'أبو النمرس', 'الوراق', 'إمبابة', 'الدقي',
    'العجوزة', 'بولاق الدكرور', 'أوسيم', 'كرداسة', 'المنيب',
    'الطالبية', 'ساقية مكي', 'حدائق الاهرام',
  ],
  'الإسكندرية': [
    'سيدي جابر', 'سموحة', 'المنتزه', 'سيدي بشر', 'كليوباترا', 'رشدي',
    'ستانلي', 'الابراهيمية', 'العصافرة', 'المندرة', 'جليم', 'لوران',
    'محرم بك', 'العطارين', 'بحري', 'العجمي', 'الدخيلة', 'المعمورة',
    'كامب شيزار', 'فليمنج', 'ميامي', 'أبو قير', 'المنشية', 'الشاطبي',
    'باكوس', 'بولكلي', 'زيزينيا', 'الحضرة', 'كرموز', 'العامرية',
    'برج العرب', 'المكس',
  ],
  'المنصورة': [
    'المنصورة', 'ميت غمر', 'طلخا', 'دكرنس', 'أجا', 'السنبلاوين', 'شربين',
    'بلقاس', 'المنزلة', 'تمي الأمديد', 'نبروه', 'منية النصر', 'الجمالية',
  ],
  'طنطا': [
    'طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'بسيون', 'سمنود',
    'قطور', 'السنطة', 'المحلة', 'صفط تراب',
  ],
  'الزقازيق': [
    'الزقازيق', 'بلبيس', 'العاشر من رمضان', 'أبو حماد', 'منيا القمح', 'فاقوس',
    'أبو كبير', 'ههيا', 'كفر صقر', 'ديرب نجم', 'الحسينية', 'الصالحية الجديدة',
  ],
  'أسيوط': [
    'أسيوط', 'ديروط', 'القوصية', 'أبنوب', 'الفتح', 'منفلوط',
    'أسيوط الجديدة', 'الغنايم', 'ساحل سليم', 'أبو تيج', 'صدفا', 'البداري',
  ],
  'الأقصر': [
    'الأقصر', 'الأقصر شرق', 'الأقصر غرب', 'الزينية', 'الطود', 'البياضية',
    'أرمنت', 'القرنة', 'إسنا', 'الأقالتة',
  ],
  'أسوان': [
    'أسوان', 'إدفو', 'كوم أمبو', 'دراو', 'نصر النوبة',
    'أبو سمبل', 'البصيلية', 'السباعية',
  ],
  'بورسعيد': [
    'بورسعيد', 'الزهور', 'المناخ', 'الشرق', 'الضواحي', 'بور فؤاد',
    'العرب', 'الجنوب', 'حي الضواحي',
  ],
  'الإسماعيلية': [
    'الإسماعيلية', 'القنطرة شرق', 'فايد', 'التل الكبير', 'أبو صوير',
    'القنطرة غرب', 'القصاصين', 'نفيشة',
  ],
  'السويس': [
    'السويس', 'الأربعين', 'عتاقة', 'فيصل', 'الجناين',
    'السويس الجديدة', 'حي الأربعين', 'الهجانة',
  ],
  'دمياط': [
    'دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'كفر سعد',
    'الزرقا', 'السرو', 'عزبة البرج', 'كفر البطيخ',
  ],
  'المنيا': [
    'المنيا', 'المنيا الجديدة', 'ملوي', 'سمالوط', 'مطاي', 'بني مزار',
    'أبو قرقاص', 'دير مواس', 'العدوة', 'مغاغة', 'المنيا الأقصى',
  ],
  'سوهاج': [
    'سوهاج', 'أخميم', 'جرجا', 'طهطا', 'المراغة', 'البلينا',
    'سوهاج الجديدة', 'ساقلتة', 'دار السلام', 'المنشاة', 'جهينة',
  ],
  'بني سويف': [
    'بني سويف', 'الواسطى', 'ناصر', 'إهناسيا', 'ببا',
    'بني سويف الجديدة', 'الفشن', 'سمسطا', 'نيدة',
  ],
  'الفيوم': [
    'الفيوم', 'الفيوم الجديدة', 'سنورس', 'إبشواي', 'طامية', 'يوسف الصديق',
    'أطسا', 'الشواشنة', 'دمو',
  ],
  'شبين الكوم': [
    'شبين الكوم', 'مدينة السادات', 'منوف', 'قويسنا', 'أشمون', 'الباجور', 'تلا',
    'بركة السبع', 'الشهداء', 'سرس الليان',
  ],
  'كفر الشيخ': [
    'كفر الشيخ', 'دسوق', 'فوه', 'بيلا', 'الحامول', 'مطوبس',
    'الرياض', 'سيدي سالم', 'قلين', 'بلطيم',
  ],
  'مرسى مطروح': [
    'مرسى مطروح', 'الحمام', 'العلمين', 'الضبعة', 'سيدي عبد الرحمن',
    'الساحل الشمالي', 'رأس الحكمة', 'سيوة',
  ],
  'قنا': [
    'قنا', 'نجع حمادي', 'دشنا', 'قوص', 'أبو تشت', 'نقادة',
    'فرشوط', 'الوقف', 'قنا الجديدة',
  ],
  'الغردقة': [
    'الغردقة', 'سهل حشيش', 'الجونة', 'مكادي', 'القصير',
    'سفاجا', 'مرسى علم', 'الاحياء',
  ],
  'شرم الشيخ': [
    'شرم الشيخ', 'نبق', 'خليج نعمة', 'هضبة أم السيد', 'رأس محمد',
    'شرم القديمة', 'دهب', 'نويبع', 'طابا',
  ],
  'بنها': [
    'بنها', 'شبرا الخيمة', 'قليوب', 'القناطر الخيرية', 'كفر شكر',
    'طوخ', 'شبين القناطر', 'الخصوص', 'العبور',
  ],
};

// Helper: scrape a single Google Maps query using an existing page
async function scrapeGMapsQuery(page, query, maxPerQuery) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Handle cookie consent if it appears
  try {
    const consentBtn = await page.$('button[aria-label*="Accept"], button[aria-label*="قبول"], form[action*="consent"] button');
    if (consentBtn) await consentBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  } catch {}

  // Wait for search results to load
  try {
    await page.waitForSelector('div[role="feed"], div.Nv2PK', { timeout: 15000 });
  } catch {}

  // Scroll the results panel to load more items
  await autoScroll(page, maxPerQuery);

  // Extract business data from the rendered DOM
  const businesses = await page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const items = document.querySelectorAll('div.Nv2PK');

    for (const item of items) {
      const nameEl = item.querySelector('.qBF1Pd, .fontHeadlineSmall, .NrDZNb');
      let name = nameEl ? nameEl.textContent.trim() : '';
      if (!name) {
        const linkEl = item.querySelector('a.hfpxzc');
        name = linkEl ? (linkEl.getAttribute('aria-label') || '').trim() : '';
      }
      if (!name || seen.has(name)) continue;
      seen.add(name);

      const ratingEl = item.querySelector('.MW4etd');
      const rating = ratingEl ? parseFloat(ratingEl.textContent) || 0 : 0;

      const infoDivs = item.querySelectorAll('.W4Efsd');
      const textSegments = [];
      for (const div of infoDivs) {
        const rawText = div.textContent || '';
        const parts = rawText.split(/\s*\u00b7\s*/);
        for (const p of parts) {
          const t = p.trim();
          if (t && t.length > 1) textSegments.push(t);
        }
      }

      let phone = '';
      let address = '';
      let category = '';

      for (const seg of textSegments) {
        if (/^\d+\.\d+\(\d+\)$/.test(seg) || /^\(\d+\)$/.test(seg)) continue;
        if (/^[\d\.\s]+$/.test(seg)) continue;

        const digits = seg.replace(/[^\d]/g, '');
        if (digits.length >= 8 && /^[\+\d]/.test(seg.trim()) && !phone) {
          phone = seg.trim();
          continue;
        }
        if (!category && seg.length < 30 && !seg.includes(',')) {
          category = seg;
          continue;
        }
        if (!address && seg.length > 3) {
          address = seg;
        }
      }

      const websiteEl = item.querySelector('a[data-value="Website"], a[href*="http"]:not([href*="google"])');
      const website = websiteEl ? websiteEl.href || '' : '';

      results.push({ name, phone, address, website, rating, category });
    }

    return results;
  });

  // Enrich: click into EVERY business to extract phone from detail panel
  for (let i = 0; i < Math.min(businesses.length, maxPerQuery); i++) {
    try {
      const links = await page.$$('a.hfpxzc');
      if (i >= links.length) break;
      await links[i].click();

      try {
        await page.waitForSelector(
          'button[data-item-id^="phone:"], [data-item-id="authority"], div.m6QErb',
          { timeout: 4000 }
        );
      } catch {}
      await new Promise(r => setTimeout(r, 800));

      const detail = await page.evaluate(() => {
        let phone = '';
        let website = '';
        let address = '';

        const phoneEl = document.querySelector('button[data-item-id^="phone:"]');
        if (phoneEl) {
          const attr = phoneEl.getAttribute('data-item-id') || '';
          const m = attr.match(/phone:tel:(.+)/) || attr.match(/phone:(.+)/);
          if (m) phone = m[1];
        }

        if (!phone) {
          const allBtns = document.querySelectorAll('button[aria-label], a[aria-label]');
          for (const btn of allBtns) {
            const label = btn.getAttribute('aria-label') || '';
            const m = label.match(/(?:هاتف|Phone|رقم)[:\s]*(\+?[\d][\d\s\-\(\)]{6,})/i);
            if (m) { phone = m[1]; break; }
          }
        }

        if (!phone) {
          const infoItems = document.querySelectorAll('.CsEnBe, .RcCsl, div[data-tooltip]');
          for (const el of infoItems) {
            const text = (el.textContent || '').trim();
            const digits = text.replace(/[^\d]/g, '');
            if (digits.length >= 8 && digits.length <= 15 && /^[\+\d]/.test(text)) {
              phone = text;
              break;
            }
          }
        }

        const webEl = document.querySelector('a[data-item-id="authority"]');
        if (webEl) website = webEl.href || '';

        const addrEl = document.querySelector('button[data-item-id="address"]');
        if (addrEl) address = (addrEl.getAttribute('aria-label') || '').replace(/^(عنوان|Address)[:\s]*/i, '').trim();

        return { phone, website, address };
      });

      if (detail.phone) businesses[i].phone = detail.phone;
      if (detail.website && !businesses[i].website) businesses[i].website = detail.website;
      if (detail.address && !businesses[i].address) businesses[i].address = detail.address;

      const backBtn = await page.$('button[aria-label*="Back"], button[aria-label*="رجوع"], button[jsaction*="back"]');
      if (backBtn) {
        await backBtn.click();
        await new Promise(r => setTimeout(r, 800));
      } else {
        await page.goBack({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1200));
      }

      try {
        await page.waitForSelector('div[role="feed"], div.Nv2PK', { timeout: 4000 });
      } catch {}
    } catch {
      // If enrichment fails for one item, continue to next
    }
  }

  return businesses;
}

// Clean and normalize a single business record
function cleanBusiness(b, industry, city) {
  let phone = (b.phone || '').replace(/^tel:/, '').replace(/\s+/g, '').trim();
  let address = (b.address || '')
    .replace(/[\s\u200b]*(مفتوح|مغلق|Open|Closed|سيغلق قريبًا|يفتح قريبًا|على مدار الساعة|24 ساعة)[\s\u200b]*/gi, '')
    .replace(/\d{3}[\s-]?\d{7,}$/g, '')
    .trim();

  return {
    company_name: b.name,
    phone,
    email: '',
    website: b.website || '',
    industry: industry || b.category || '',
    city: city || '',
    source: 'gmaps',
    address,
    rating: b.rating || 0,
  };
}

// Build query list helper
function buildQueryList(searchQuery, city, industry, comprehensive) {
  const baseQuery = searchQuery || `${industry || ''} في ${city || ''}`.trim();
  if (!comprehensive || !city) return [baseQuery];

  const areas = CITY_AREAS[city] || [];
  const queries = [baseQuery];
  const searchTerm = searchQuery
    ? searchQuery.replace(new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').replace(/\s*(في|بـ|ب|فى)\s*$/g, '').trim()
    : (industry || '');
  for (const area of areas) {
    queries.push(`${searchTerm} في ${area}`);
  }
  return queries;
}

// ============================================================
// Google Maps — SSE streaming endpoint (results sent in real-time)
// ============================================================
router.get('/gmaps/stream', async (req, res) => {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let browser = null;
  const { searchQuery, city, industry, maxResults: maxResultsStr, comprehensive: compStr } = req.query;
  const maxResults = parseInt(maxResultsStr) || 40;
  const comprehensive = compStr === 'true';

  if (!searchQuery && !city) {
    send('error', { error: 'searchQuery or city is required' });
    res.end();
    return;
  }

  try {
    const queries = buildQueryList(searchQuery, city, industry, comprehensive);
    const limit = Math.min(maxResults, 10000);
    // In comprehensive mode, limit per-area to 40 (breadth over depth)
    const maxPerQuery = comprehensive ? Math.min(100, limit) : limit;

    send('status', { 
      message: comprehensive ? `بدء البحث الشامل — ${queries.length} منطقة` : 'بدء البحث...', 
      totalQueries: queries.length 
    });

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=ar',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar,en-US;q=0.9' });

    const seenNames = new Set();
    const seenPhones = new Set();
    let totalScraped = 0;
    let totalWithPhone = 0;
    let totalNew = 0;
    let totalAlreadySaved = 0;
    const queryStats = [];

    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];

      // Check if client disconnected
      if (res.writableEnded || res.destroyed) {
        console.log('[gmaps/stream] Client disconnected, stopping scrape');
        break;
      }

      send('progress', { 
        queryIndex: qi, 
        totalQueries: queries.length, 
        currentQuery: q,
        message: `جاري البحث في: ${q}` 
      });

      try {
        const businesses = await scrapeGMapsQuery(page, q, maxPerQuery);
        const newBusinesses = [];
        
        for (const b of businesses) {
          const key = b.name.trim().toLowerCase();
          const phoneKey = (b.phone || '').replace(/[^\d]/g, '');
          if (seenNames.has(key)) continue;
          if (phoneKey && seenPhones.has(phoneKey)) continue;
          seenNames.add(key);
          if (phoneKey) seenPhones.add(phoneKey);
          newBusinesses.push(b);
        }

        // Clean and filter for phone
        const cleaned = newBusinesses.map(b => cleanBusiness(b, industry, city));
        const withPhone = cleaned.filter(r => r.phone && r.phone.length >= 8);

        // Check DB for dedup
        let results = withPhone;
        if (withPhone.length > 0) {
          const phoneNumbers = withPhone.map(r => r.phone);
          const existingLeads = await Lead.find(
            { phone: { $in: phoneNumbers } },
            { phone: 1 }
          ).lean();
          const existingPhones = new Set(existingLeads.map(l => l.phone));
          results = withPhone.map(r => ({
            ...r,
            alreadySaved: existingPhones.has(r.phone),
          }));
        }

        totalScraped += cleaned.length;
        totalWithPhone += results.length;
        const qNewCount = results.filter(r => !r.alreadySaved).length;
        const qSavedCount = results.filter(r => r.alreadySaved).length;
        totalNew += qNewCount;
        totalAlreadySaved += qSavedCount;

        const stat = { query: q, found: businesses.length, new: qNewCount };
        queryStats.push(stat);

        // Stream the results for this area immediately
        if (results.length > 0) {
          send('results', { 
            area: q, 
            areaIndex: qi,
            leads: results,
            areaStat: stat,
          });
        }

        // Send cumulative stats update
        send('stats', {
          totalScraped,
          withPhone: totalWithPhone,
          newLeads: totalNew,
          alreadySaved: totalAlreadySaved,
          queriesCompleted: qi + 1,
          totalQueries: queries.length,
        });

      } catch (err) {
        console.error(`[gmaps/stream] Error scraping "${q}":`, err.message);
        queryStats.push({ query: q, found: 0, new: 0, error: err.message });
        send('areaError', { query: q, error: err.message, queryIndex: qi });
      }

      if (totalWithPhone >= limit) break;
    }

    await browser.close();
    browser = null;

    // Send final completion event
    send('done', {
      total: totalWithPhone,
      totalScraped,
      withPhone: totalWithPhone,
      newLeads: totalNew,
      alreadySaved: totalAlreadySaved,
      queriesRun: queries.length,
      queryStats,
      query: { searchQuery: searchQuery || `${industry || ''} في ${city || ''}`.trim(), city, industry, comprehensive },
    });

    res.end();
  } catch (err) {
    console.error('[gmaps/stream] Fatal error:', err.message);
    send('error', { error: err.message });
    res.end();
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
});

// Keep the POST endpoint for non-streaming (backward compat)
router.post('/gmaps', async (req, res) => {
  let browser = null;
  try {
    const { searchQuery, city, industry, maxResults = 40, comprehensive = false } = req.body;
    if (!searchQuery && !city) {
      return res.status(400).json({ error: 'searchQuery or city is required' });
    }

    const queries = buildQueryList(searchQuery, city, industry, comprehensive);
    const limit = Math.min(maxResults, 10000);
    const maxPerQuery = comprehensive ? Math.min(100, limit) : limit;

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=ar',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar,en-US;q=0.9' });

    const allBusinesses = [];
    const seenNames = new Set();
    const seenPhones = new Set();
    const queryStats = [];

    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];
      try {
        const businesses = await scrapeGMapsQuery(page, q, maxPerQuery);
        let added = 0;
        for (const b of businesses) {
          const key = b.name.trim().toLowerCase();
          const phoneKey = (b.phone || '').replace(/[^\d]/g, '');
          if (seenNames.has(key)) continue;
          if (phoneKey && seenPhones.has(phoneKey)) continue;
          seenNames.add(key);
          if (phoneKey) seenPhones.add(phoneKey);
          allBusinesses.push(b);
          added++;
        }
        queryStats.push({ query: q, found: businesses.length, new: added });
      } catch (err) {
        queryStats.push({ query: q, found: 0, new: 0, error: err.message });
      }
      if (allBusinesses.length >= limit) break;
    }

    await browser.close();
    browser = null;

    const allResults = allBusinesses.slice(0, limit).map(b => cleanBusiness(b, industry, city));
    const withPhone = allResults.filter(r => r.phone && r.phone.length >= 8);

    const phoneNumbers = withPhone.map(r => r.phone);
    const existingLeads = await Lead.find(
      { phone: { $in: phoneNumbers } },
      { phone: 1 }
    ).lean();
    const existingPhones = new Set(existingLeads.map(l => l.phone));

    const results = withPhone.map(r => ({
      ...r,
      alreadySaved: existingPhones.has(r.phone),
    }));
    results.sort((a, b) => (a.alreadySaved === b.alreadySaved ? 0 : a.alreadySaved ? 1 : -1));

    const newCount = results.filter(r => !r.alreadySaved).length;
    const existingCount = results.filter(r => r.alreadySaved).length;

    res.json({
      total: results.length,
      totalScraped: allResults.length,
      withPhone: results.length,
      newLeads: newCount,
      alreadySaved: existingCount,
      queriesRun: queries.length,
      queryStats,
      query: { searchQuery: searchQuery || `${industry || ''} في ${city || ''}`.trim(), city, industry, comprehensive },
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
});

async function autoScroll(page, targetCount) {
  const feedSelector = 'div[role="feed"]';
  const scrollable = await page.$(feedSelector);
  if (!scrollable) return;

  let prevCount = 0;
  let staleRounds = 0;

  for (let i = 0; i < 200; i++) {
    const count = await page.evaluate(
      (sel) => document.querySelectorAll(sel).length,
      'div.Nv2PK'
    );

    // Check if we've hit Google's "end of list" marker
    const reachedEnd = await page.evaluate((sel) => {
      const feed = document.querySelector(sel);
      if (!feed) return false;
      // Google Maps shows a message or a specific element at the end of results
      const endText = feed.querySelector('.HlvSq, .m6QErb + div, p.fontBodyMedium');
      if (endText && /نهاية|end of|لا توجد نتائج أخرى|No more results/i.test(endText.textContent || '')) return true;
      return false;
    }, feedSelector);

    if (count >= targetCount || reachedEnd || staleRounds >= 5) break;
    if (count === prevCount) staleRounds++;
    else staleRounds = 0;
    prevCount = count;

    // Scroll aggressively — large distance + scroll to bottom
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollBy(0, 10000);
        el.scrollTop = el.scrollHeight;
      }
    }, feedSelector);

    // Longer wait to allow lazy-loading, especially for slower connections
    await new Promise(r => setTimeout(r, 2000));
  }
}

// ============================================================
// Save scraped results as leads (bulk import with dedup)
// ============================================================
router.post('/save', async (req, res) => {
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
          phone: data.phone.replace(/\s+/g, ''),
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

export default router;
