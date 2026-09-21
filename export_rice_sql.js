const http = require('https');
const fs = require('fs');

async function exportSql() {
  const observations = [];
  for (let m = 3; m <= 9; m++) {
    const url = 'https://api.agmarknet.gov.in/v1/prices-and-arrivals/date-wise/specific-commodity?year=2026&month=' + m + '&stateId=31&commodityId=24';
    const res = await new Promise((resolve, reject) => {
      http.get(url, r => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    const mkt = res.markets ? res.markets.find(x => x.marketName && x.marketName.includes('Viruthachalam')) : null;
    if (mkt && mkt.dates) {
      for (const d of mkt.dates) {
        const [day, month, year] = d.arrivalDate.split('/').map(Number);
        if (m === 9 && day > 2) continue;
        if (d.data) {
          for (const item of d.data) {
            observations.push({
              commodity: 'Rice',
              state: 'Tamil Nadu',
              district: '',
              market: mkt.marketName,
              variety: item.variety || 'Red Nanital',
              minPrice: item.minimumPrice,
              maxPrice: item.maximumPrice,
              modalPrice: item.modalPrice,
              pricePerKg: item.modalPrice / 100.0,
              marketDate: year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
              source: 'AGMARKNET'
            });
          }
        }
      }
    }
  }

  let sql = 'INSERT INTO gov_market_observations (commodity, state, district, market, variety, min_price, max_price, modal_price, price_per_kg, market_date, source, fetched_at) VALUES\n';
  const rows = observations.map(o => {
    return `('${o.commodity}', '${o.state}', '${o.district}', '${o.market}', '${o.variety}', ${o.minPrice}, ${o.maxPrice}, ${o.modalPrice}, ${o.pricePerKg}, '${o.marketDate}', '${o.source}', NOW())`;
  });
  sql += rows.join(',\n') + ';\n';
  fs.writeFileSync('c:/Users/dharu/OneDrive/Desktop/capstone/seed_rice_viruthachalam.sql', sql);
  console.log(`Successfully wrote ${observations.length} observations to seed_rice_viruthachalam.sql`);
}

exportSql().catch(console.error);
