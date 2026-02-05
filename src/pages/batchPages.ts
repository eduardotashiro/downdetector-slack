import { chromium, Page, Browser } from "playwright";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";
import type { ServiceProperties } from "../types/downdetector.js";

const client = new BrowsercashSDK({
    apiKey: config.api.apiKey,
});

interface ServicesResult {
    name: string,
    url: string,
    data: ServiceProperties
}
interface ServicesList {
    name: string,
    url: string
}

const SERVICES: ServicesList[] = [
    { name: "Pix", url: "https://downdetector.com.br/fora-do-ar/pix/" },
    { name: "Banco Itaú", url: "https://downdetector.com.br/fora-do-ar/banco-itau/" },
    { name: "Bradesco", url: "https://downdetector.com.br/fora-do-ar/bradesco/" },
    { name: "Santander", url: "https://downdetector.com.br/fora-do-ar/santander/" },
    { name: "Nubank", url: "https://downdetector.com.br/fora-do-ar/nubank/" },
    { name: "Banco do Brasil", url: "https://downdetector.com.br/fora-do-ar/banco-do-brasil/" },
    { name: "Mercado Pago", url: "https://downdetector.com.br/fora-do-ar/mercadopago/" },
    { name: "Pic Pay", url: "https://downdetector.com.br/fora-do-ar/picpay/" }
];


export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));


async function waitForServiceProperties(page: Page, timeout = 15000): Promise<ServiceProperties | undefined> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const data = await page.evaluate(() => window.DD?.currentServiceProperties);
        if (data) {
            return data;
        }
        await delay(500);
    }
    return undefined;
}

async function checkServiceStatus(page: Page, service: ServicesList): Promise<ServiceProperties | undefined> {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
    });
    const data = await waitForServiceProperties(page);
    if (!data) {
        throw new Error("ServiceProperties not found");
    }
    return data;
}

export async function checkAllServices(): Promise<ServicesResult[]> {
    const results: ServicesResult[] = [];
    let browser: Browser | undefined;
    let session;

    try {
        session = await client.browser.session.create();

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
                        data
                    });
                    console.log(`💀 ${service.name}: ${data.status}`);
                }
            } catch (error: any) {
                console.log(`${service.name}: ${error.message}`);
            } finally {
                await page.close();
            }
            await delay(1000);
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