import { Camoufox } from "camoufox-js";
import type { Browser, BrowserContext, Page } from "playwright";
import { ServiceName, ServiceURL, ServiceStatus } from "../slack/types.js";

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

async function clickTurnstile(page: Page): Promise<boolean> {
    try {
        const frame = page.frameLocator('iframe[src*="challenges.cloudflare"]');
        await frame
            .locator('input[type="checkbox"], .ctp-checkbox-label, [role="checkbox"]')
            .first()
            .click({ timeout: 4000 });
        return true;
    } catch {
        return false;
    }
}

async function waitForRealContent(page: Page): Promise<boolean> {
    const deadline = Date.now() + 60000;

    while (Date.now() < deadline) {
        const body = await page
            .evaluate(() => document.body?.innerText?.toLowerCase() || "")
            .catch(() => "");

        if (body.includes("relatos dos usuários") ||
            body.includes("relatar um problema") ||
            body.includes("user reports show") ||
            body.includes("report a problem")) {
            return true;
        }

        const clicked = await clickTurnstile(page);
        await new Promise(r => setTimeout(r, clicked ? 5000 : 2000));
    }

    return false;
}

async function detectStatus(page: Page): Promise<string | null> {
    try {
        const body = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");

        if (body.includes("não mostram problemas") ||
            body.includes("no current problems")) {
            return ServiceStatus.SUCCESS;
        }
        if (body.includes("possíveis problemas") ||
            body.includes("possible problems")) {
            return ServiceStatus.WARNING;
        }
        if (body.includes("mostram problemas") ||
            body.includes("show problems with")) {
            return ServiceStatus.DANGER;
        }
        return null;
    } catch {
        return null;
    }
}

async function tryOnce(context: BrowserContext, service: ServicesList): Promise<{ status: string | null; page: Page }> {
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(60000);

    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' });

    try {
        await page.goto(service.url, { waitUntil: "domcontentloaded", timeout: 60000 });
        const loaded = await waitForRealContent(page);
        if (!loaded) {
            return { status: null, page };
        }

        const status = await detectStatus(page);
        return { status, page };

    } catch {
        return { status: null, page };
    }
}

export async function checkAllServices(): Promise<ServicesResult[]> {
    const results: ServicesResult[] = [];
    let browser: Browser | undefined;

    try {
        browser = (await Camoufox({
            headless: false,
            block_webrtc: true,
            window: [1280, 800],
            os: "linux",
            humanize: true,
            geoip: true,
            fonts: ["Arial", "Times New Roman", "Helvetica", "DejaVu Sans"],
            navigator: {
                platform: "Linux x86_64",
                hardware_concurrency: 4,
                device_memory: 8
            }
        })) as Browser;

        // cookie cf_clearance vale pra todos
        const context = await browser.newContext();

        try {
            for (const service of SERVICES) {

                let { status, page } = await tryOnce(context, service);

                if (!status) {
                    await page.close().catch(() => { });
                    console.log(`${service.name}: retry após falha...`);
                    await new Promise(r => setTimeout(r, 2000));
                    const retry = await tryOnce(context, service);
                    status = retry.status;
                    page = retry.page;
                }

                if (status) {
                    results.push({ name: service.name, url: service.url, outage: status });
                } else {
                    console.log(`${service.name} SEM STATUS ! (X.X)`);
                }

                await page.close().catch(() => { });
                await new Promise(r => setTimeout(r, 1000));
            }
        } finally {
            await context.close().catch(() => { });
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    return results;
}