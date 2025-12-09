import { chromium, BrowserContextOptions } from 'playwright';

const url = "https://downdetector.com.br/fora-do-ar/pix/";


const PROXY = {
  // server: "http://****", 
  // username: "user",
  // password: "pswd"
};

export async function checkPixStatus(): Promise<any> {
  const launchOptions: any = {
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled"
    ]
  };

  // só da gringa
  // if (PROXY.server) launchOptions.proxy = {
  //   server: PROXY.server,
  //   username: PROXY.username,
  //   password: PROXY.password
  // };

  const browser = await chromium.launch(launchOptions);

  const contextOptions: BrowserContextOptions = {
    viewport: { width: 1280, height: 720 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    userAgent: "",
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9'
    }
  };

  const context = await browser.newContext(contextOptions);

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window['outerWidth'] = window.innerWidth;
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'en-US'] });
  });

  const page = await context.newPage();

  try {
    console.log("acessando:", url);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    console.log("Título macabro:", await page.title());

    await page.waitForFunction(() => {
      const w: any = window as any;
      return !!(w.DD && w.DD.currentServiceProperties);
    }, { timeout: 30000 });

    const dados = await page.evaluate(() => {
      const w: any = window as any;
      return w.DD?.currentServiceProperties ?? null;
    });
    console.log("nunca chega aqui");
    console.log("Dados obtidos!");
    console.log("Status:", dados?.status);
    console.log(" Company:", dados?.company);

    await browser.close();
    return dados;

  } catch (err) {
    console.error(" Erro :", err);
    await browser.close();
    return null;
  }
}
