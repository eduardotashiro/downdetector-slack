import { chromium, Page, Browser } from "playwright";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";
import type { ServiceProperties } from "../types/downdetector.js";
import { ServiceName, ServiceURL } from "../slack/types.js";

const client = new BrowsercashSDK({
    apiKey: config.api.apiKey,
});

interface ServicesResult {
    name: ServiceName,
    url: ServiceURL,
    data: ServiceProperties
}

interface ServicesList {
    name: ServiceName,
    url: ServiceURL
}

const SERVICES: ServicesList[] = [
    { name: ServiceName.PIX, url: ServiceURL.PIX },
    { name: ServiceName.ITAU, url: ServiceURL.ITAU },
    { name: ServiceName.BRADESCO, url: ServiceURL.BRADESCO },
    { name: ServiceName.SANTANDER, url: ServiceURL.SANTANDER },
    { name: ServiceName.NUBANK, url: ServiceURL.NUBANK },
    { name: ServiceName.BANCO_DO_BRASIL, url: ServiceURL.BANCO_DO_BRASIL },
    { name: ServiceName.MERCADO_PAGO, url: ServiceURL.MERCADO_PAGO },
    { name: ServiceName.PICPAY, url: ServiceURL.PICPAY }
];

async function waitForServiceProperties(page: Page): Promise<ServiceProperties | null> {
    try {
        let data = await page.evaluate(() => window.DD?.currentServiceProperties);

        if (data) {
            console.log(`>>>>>>`);
            return data;
        }

        await page.waitForFunction(() => window.DD?.currentServiceProperties, { timeout: 10000 });
        data = await page.evaluate(() => window.DD!.currentServiceProperties);
        console.log(`zzzzzz`);

        return data;
    } catch (error) {
        console.log(`waitForServiceProperties, Erro: ${(error as Error).message}`);
        return null;
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

        const context = browser.contexts()[0]

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