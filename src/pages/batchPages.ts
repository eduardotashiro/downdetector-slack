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


function randomDelay(minMs = 3000, maxMs = 8000) {
    return Math.floor(Math.random() * (maxMs - minMs) + minMs);
}

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));


async function waitForServiceProperties(page: Page, timeout: number = 30000): Promise<ServiceProperties | null> {
    try {
        await page.waitForFunction(() => window.DD?.currentServiceProperties, { timeout });
        return await page.evaluate(() => { return window.DD!.currentServiceProperties; });
    } catch (error) {
        return null
    }
}

async function checkServiceStatus(page: Page, service: ServicesList): Promise<ServiceProperties | null> {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
    });
    return await waitForServiceProperties(page);
}

export async function checkAllServices(): Promise<ServicesResult[]> {
    const results: ServicesResult[] = [];
    let browser: Browser | undefined;
    let session: any;

    try {
        session = await client.browser.session.create();
        console.log("Session:", session.sessionId);
        console.log("CDP URL:", session.cdpUrl);
        browser = await chromium.connectOverCDP(session.cdpUrl as string);

        for (const service of SERVICES) {
            const context = await browser.newContext();
            const page = await context.newPage();
            try {
                const data = await checkServiceStatus(page, service);

                if (!data) {
                    console.warn(`${service.name}: data not available`);
                    continue;
                }

                results.push({
                    name: service.name,
                    url: service.url,
                    data
                });
                console.log(`💀 ${service.name}: ${data.status}`);

            } catch (error: any) {
                console.log(`${service.name}: ${error.message}`);
            } finally {
                await page.close();
                await context.close();
            }
            await delay(randomDelay());
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