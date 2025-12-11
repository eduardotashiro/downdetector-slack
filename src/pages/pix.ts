import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { config } from '../config/env';

chromium.use(stealth());

const url = "https://downdetector.com.br/fora-do-ar/pix/";

export async function checkPixStatus() {

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false,
    proxy: {   
      server:config.proxy.server,
      username:config.proxy.username,
      password:config.proxy.password
    }
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo'
  });

  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log("titulo:", await page.title());

    const titulo = await page.title();

    if (titulo.includes('momento') || titulo.includes('Um momento...')) {
      console.log("FALL BACK PRO CLAUD, QUE ACABOU VIRANDO UM TEMPO DE SEGURANÇA...");
      await page.waitForTimeout(15000);
    }

    await page.waitForFunction(() => {
      return window.DD?.currentServiceProperties !== undefined;  //JS QUE VAI RODAR NA PÁG
    }, { timeout: 30000 });

    const dados = await page.evaluate(() => {
      return window.DD?.currentServiceProperties; //JS RODOU NA PÁG
    });

    if (dados) {
      console.log("============== '-' DBUG PIX '-' ==================");
      console.log("=-=-=-=-=-=-=-=-= Status -=-=-=-=-=-=-=");
      console.log("Status:", dados.status);
      console.log("=-=-=-=-=-=-=-=-= Company -=-=-=-=-=-=-=");
      console.log("Company:", dados.company);
      console.log("=-=-=-=-=-=-=-=-= Reports e Baseline -=-=-=-=-=-=-=");
      console.log("reports data:", dados.series.reports.data)
      console.log("baseline data:", dados.series.baseline.data)
      console.log("============== '-'  FIM DBUG PIX '-' ==================");
      

    }

    await browser.close();
    return dados;

  } catch (error) {
    console.error("Erro:", error);

    await browser.close();
    return null;
  }
}