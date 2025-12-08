import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

const url = "https://downdetector.com.br/fora-do-ar/banco-itau/";

export async function checkItauStatus() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url);

    const dados = await page.evaluate(() => { return window.DD?.currentServiceProperties; });

    await browser.close();

    return dados;
}