import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";


chromium.use(stealth());

const client = new BrowsercashSDK({
    apiKey: config.api.apiKey,
});

const SERVICES = [
    { name: "Pix", url: "https://downdetector.com.br/fora-do-ar/pix/" },
    { name: "Itaú", url: "https://downdetector.com.br/fora-do-ar/banco-itau/" },
    { name: "Bradesco", url: "https://downdetector.com.br/fora-do-ar/bradesco/" },
    { name: "Santander", url: "https://downdetector.com.br/fora-do-ar/santander/" },
    { name: "Nubank", url: "https://downdetector.com.br/fora-do-ar/nubank/" },
    { name: "Banco do Brasil", url: "https://downdetector.com.br/fora-do-ar/banco-do-brasil/" },
];

const delay = (min = 4000, max = 9000) =>
    new Promise(res =>
        setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min)
    );

async function tentarAcessarServico(page: any, service: any) {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded",
        timeout: 40000,
    });

    await page.waitForFunction(
        () => window.DD?.currentServiceProperties !== undefined,
        { timeout: 20000, polling: 800 }
    );

    return await page.evaluate(() => window.DD?.currentServiceProperties);
}

export async function checkAllServices() {

    const session = await client.browser.session.create();


    console.log("Session:", session.sessionId);

    const browser = await chromium.connectOverCDP(session.cdpUrl as string);
    const context = browser.contexts()[0];

    const resultados = [];

    try {
        for (const service of SERVICES) {
            const page = await context.newPage();

            try {
                const dados = await tentarAcessarServico(page, service);

                await page.route("**/*", (route) => {
                    const url = route.request().url();
                    const type = route.request().resourceType();


                    if (
                        url.includes("google-analytics") ||
                        url.includes("googletagmanager") ||
                        url.includes("gtag") ||
                        url.includes("facebook.com") ||
                        url.includes("facebook.net") ||
                        url.includes("doubleclick") ||
                        url.includes("hotjar") ||
                        url.includes("/ads/") ||
                        url.includes("analytics") ||
                        url.includes("clarity.ms") ||
                        url.includes("newrelic.com") ||
                        url.includes("datadoghq.com") ||
                        url.includes("sentry.io") ||
                        url.includes("taboola") ||
                        url.includes("outbrain") ||
                        url.includes("amazon-adsystem")
                    ) {
                        return route.abort();
                    }




                    if (type === 'document') {
                        return route.continue();
                    }


                    if (url.includes('downdetector.com') || url.includes('downdetector.br')) {
                        if (['script', 'xhr', 'fetch'].includes(type)) {
                            return route.continue();
                        }
                    }


                    return route.abort();
                });

                if (dados) {
                    resultados.push({
                        nome: service.name,
                        url: service.url,
                        dados
                    });

                    console.log(`💀 ${service.name}: ${dados.status}`);
                }
            } finally {
                await page.close();
                await delay(5000, 12000);
            }
        }

        return resultados;
    } finally {

        await browser.close();
        await client.browser.session.stop({
            sessionId: session.sessionId,
        });
    }
}
