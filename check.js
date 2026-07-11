const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.toString()));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE ERROR: ' + msg.text()); });
  try { 
    await page.goto('http://127.0.0.1:4000/lab/', { waitUntil: 'networkidle0', timeout: 15000 });
    // Click all play buttons
    await page.evaluate(() => {
      document.querySelectorAll('.labf__play').forEach(btn => btn.click());
    });
    // Wait 3 seconds to let animations run
    await new Promise(r => setTimeout(r, 3000));
  } catch(e) {}
  if (errors.length > 0) { console.log('Found errors:'); errors.forEach(e => console.log(e)); } else { console.log('No errors while playing.'); }
  await browser.close();
})();
