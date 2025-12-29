import { chromium } from "playwright";

const BRIGHT_DATA_API_CDP_URL =
  "wss://brd-customer-hl_40daba99-zone-scraping_browser1:dn1cw8um23mm@brd.superproxy.io:9222";

(async () => {
  // Conecta ao navegador remoto via CDP
  const browser = await chromium.connectOverCDP(
    BRIGHT_DATA_API_CDP_URL
  );

  const context = await browser.newContext();
  const page = await context.newPage();

  // Acessa a página alvo
  await page.goto("https://www.scrapingcourse.com/cloudflare-challenge");

  let challengeBypassed = false;

  try {
    // Aguarda o texto aparecer na página
    await page
      .locator("text=You bypassed the Cloudflare challenge! :D")
      .waitFor({ timeout: 5000 });

    challengeBypassed = true;
  } catch (error) {
    if (error) {
      challengeBypassed = false;
    } else {
      throw error;
    }
  }

  // Fecha o navegador
  await browser.close();

  console.log("Cloudflare Bypassed:", challengeBypassed);
})();
