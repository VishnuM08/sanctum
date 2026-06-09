import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForSelector('.sidebar', { timeout: 10000 });
  
  // Click the Templates button
  console.log('Clicking Templates...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.sidebar-nav-item'));
    const templatesBtn = buttons.find(b => b.textContent.includes('Templates'));
    if (templatesBtn) {
      templatesBtn.click();
    } else {
      console.log('Templates button not found!');
    }
  });
  
  // Wait a bit to let it render
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.evaluate(() => {
    const templatesPage = document.querySelector('.templates-page');
    return templatesPage ? templatesPage.innerHTML.substring(0, 200) : 'NO .templates-page FOUND';
  });
  
  console.log('Templates page HTML start:', content);
  
  await browser.close();
  process.exit(0);
})();
