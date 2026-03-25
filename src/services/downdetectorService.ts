import { chromium, Page, Browser } from "playwright";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";
import type { ServiceStatus } from "../types/downdetector.js";
import { ServiceName, ServiceURL } from "../slack/types.js";

const client = new BrowsercashSDK({
    apiKey: config.api.apiKey,
});

export interface ServicesResult {
    name: ServiceName,
    url: ServiceURL,
    data: boolean
}

interface ServicesList {
    name: ServiceName,
    url: ServiceURL
}

const SERVICES: ServicesList[] = [
    { name: ServiceName.PICPAY, url: ServiceURL.PICPAY },
    { name: ServiceName.NUBANK, url: ServiceURL.NUBANK },
    { name: ServiceName.PIX, url: ServiceURL.PIX },
    { name: ServiceName.SANTANDER, url: ServiceURL.SANTANDER },
    { name: ServiceName.ITAU, url: ServiceURL.ITAU },
    { name: ServiceName.BRADESCO, url: ServiceURL.BRADESCO },
    { name: ServiceName.BANCO_DO_BRASIL, url: ServiceURL.BANCO_DO_BRASIL },
    { name: ServiceName.MERCADO_PAGO, url: ServiceURL.MERCADO_PAGO }
];

async function waitForServiceProperties(page: Page): Promise<ServiceStatus | null> {
    try {
        let data = await page.evaluate(() => window.PogoConfig?.outage); //window.DD?.currentServiceProperties
        if (data) {
            console.log(`>>>>>>`);
            return data;
        }
        await page.waitForFunction(() => window.PogoConfig?.outage);
        data = await page.evaluate(() =>window.PogoConfig?.outage);
        console.log(`zzzzzz`);
        return data || null;

    } catch (error) {
        console.log(`waitForServiceProperties, Erro: ${(error as Error).message}`);
        return null;
    }
}

async function checkServiceStatus(page: Page, service: ServicesList): Promise<ServiceStatus | null> {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded"
    });
    return await waitForServiceProperties(page);  //true orfalse ?
}

export async function checkAllServices(): Promise<ServicesResult[]> {
    const results: ServicesResult[] = [];
    let browser: Browser | undefined;
    let session: any;

    try {
        session = await client.browser.session.create({
            windowSize: "1920x1080",
            type: "hosted"
        });

        console.log("Session:", session.sessionId);
        console.log("CDP URL:", session.cdpUrl);
        console.log("Node:", session.servedBy);

        browser = await chromium.connectOverCDP(session.cdpUrl as string);

        const context = browser.contexts()[0]

        context.setDefaultTimeout(10000);
        context.setDefaultNavigationTimeout(10000);

        for (const service of SERVICES) {
            const page = await context.newPage();
            try {
                const data = await checkServiceStatus(page, service);

                if (data) {
                    results.push({
                        name: service.name,
                        url: service.url,
                        data //true orfalse ?
                    });

                    console.log(`💀 ${service.name}: ${data}`);
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