import { chromium } from "playwright";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";


const client = new BrowsercashSDK({
    apiKey: config.api.apiKey,
});

const SERVICES = [
    { name: "Pix", url: "https://downdetector.com.br/fora-do-ar/pix/"},
    { name: "Banco Itaú", url: "https://downdetector.com.br/fora-do-ar/banco-itau/"},
    { name: "Bradesco", url: "https://downdetector.com.br/fora-do-ar/bradesco/"},
    { name: "Santander", url: "https://downdetector.com.br/fora-do-ar/santander/"},
    { name: "Nubank", url: "https://downdetector.com.br/fora-do-ar/nubank/"},
    { name: "Banco do Brasil", url: "https://downdetector.com.br/fora-do-ar/banco-do-brasil/"},
    { name: "Mercado Pago", url: "https://downdetector.com.br/fora-do-ar/mercadopago/"},
    { name: "Pic Pay", url: "https://downdetector.com.br/fora-do-ar/picpay/"}
];


const delay = (min = 4000, max = 9000) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min));


async function checkServiceStatus(page: any, service: { name: string, url: string }) {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
    });

    await page.waitForFunction(() => window.DD?.currentServiceProperties !== undefined, { timeout: 30000 });

    return await page.evaluate(() => window.DD?.currentServiceProperties);
}


export async function checkAllServices() {
    const results:any = [];
    let session;
    let browser;
    try {
        session = await client.browser.session.create({
            country: "CA",
            type: "hosted",
        });

        console.log("Session:", session.sessionId);
        console.log("CDP URL:", session.cdpUrl);

        browser = await chromium.connectOverCDP(session.cdpUrl as string);

        const context = browser.contexts()[0];

   for (const service of SERVICES) {
            const page = await context.newPage();
            try {
                const data = await checkServiceStatus(page, service);
                if (data) {
                    results.push({ 
                        name: service.name,
                        url: service.url, 
                        data });
                     console.log(`💀 ${service.name}: ${data.status}`);
                }
                
            } catch (error: any) {
                console.log(`${service.name}: ${error.message}`);
            } finally {
                await page.close();
            }
            await delay(2000, 4000);
        }
    } catch (error) {
        console.error("Session error:", error);
    } finally {
        if (browser) {
            await browser.close();
        }
        if (session) {
            await client.browser.session.stop({ sessionId: session.sessionId });
            console.log("Session stopp:", session.sessionId);
        }
    }
    return results;
}