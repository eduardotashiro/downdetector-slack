import { chromium, Page, Browser } from "playwright";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";
import { ServiceName, ServiceURL, ServiceStatus } from "../slack/types.js";

const client = new BrowsercashSDK({
    apiKey: config.api.apiKey,
});

export interface ServicesResult {
    name: ServiceName,
    url: ServiceURL,
    outage: string 
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
    { name: ServiceName.MERCADO_PAGO, url: ServiceURL.MERCADO_PAGO },
];

async function waitForServiceProperties(page: Page): Promise<string | null> {
    try {
     
        let bodyText = await page.evaluate(() => {
            return document.body.innerText.toLowerCase();
        });

         if (bodyText.includes("user reports show problems with")) {
            return ServiceStatus.DANGER;
        }

        if (bodyText.includes("user reports show no current problems")) {
            return ServiceStatus.SUCCESS
        }
        
        if (bodyText.includes("user reports show possible problems")) {
            return ServiceStatus.WARNING
        }
        return null;
    } catch (error) {
        console.log(`waitForServiceProperties, Erro: ${(error as Error).message}`);
        return null
    }
}

async function checkServiceStatus(page: Page, service: ServicesList): Promise<string | null> {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded"
    });
    return await waitForServiceProperties(page);
}

export async function checkAllServices(): Promise<ServicesResult[]> {
    const results: ServicesResult[] = [];

    for (const service of SERVICES) {
        let browser: Browser | undefined;
        let session: any;

        try {
            session = await client.browser.session.create({
                windowSize: "390x844", //para iphone os cara passam um pano
                type: "consumer_distributed"
            });

            // console.log("Session:", session.sessionId);
            // console.log("CDP URL:", session.cdpUrl);
            console.log("Node:", session.servedBy);

            browser = await chromium.connectOverCDP(session.cdpUrl as string);

            const context = browser.contexts()[0] || (await browser.newContext());

            context.setDefaultTimeout(10000);
            context.setDefaultNavigationTimeout(10000);

            const page = await context.newPage();
            try {
                const outage = await checkServiceStatus(page, service);

                if (outage) {
                    results.push({
                        name: service.name,
                        url: service.url,
                        outage:  outage
                    });

                    console.log(`💀 ${service.name}: ${outage}`);
                } else {
                    console.log(`${service.name} SEM STATUS ! (X.X)`);
                }
            } catch (error: any) {
                console.log(`${service.name}: ${error.message}`);
            } finally {
                await page.close();
            }
        } catch (error) {
            console.error(`Session error (${service.name}):`, error);
        } finally {
            if (browser) {
                await browser.close();
            }
            if (session) {
                await client.browser.session.stop({ sessionId: session.sessionId });
            }
        }
    }
    return results;
}