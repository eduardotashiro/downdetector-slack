import { Camoufox } from "camoufox-js";
import type { Browser, Page } from "playwright";
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

// Espera o desafio do Cloudflare desaparecer da página.
async function waitForCloudflareChallenge(page: Page): Promise<void> {
    try {
        await page.waitForFunction(
            () => !document.title.toLowerCase().includes("just a moment") &&
                  !document.body?.innerText?.toLowerCase().includes("performing security verification"),
            { timeout: 15000 }
        );
    } catch {
        // Se não sair do challenge em 15s, segue mesmo assim.
    }

    // O Cloudflare faz um reload completo da página depois de aprovar o
    // acesso. Espera esse reload assentar antes de tentar ler o conteúdo,
    // senão o document.body pode estar momentaneamente null no meio da troca.
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(1000);
}

// Lê o texto da página com algumas tentativas, caso o DOM ainda esteja
// se estabilizando logo após o reload do Cloudflare.
async function readBodyTextWithRetry(page: Page, attempts = 3): Promise<string> {
    for (let i = 0; i < attempts; i++) {
        try {
            return await page.evaluate(() => document.body.innerText.toLowerCase());
        } catch (error) {
            if (i === attempts - 1) throw error;
            await page.waitForTimeout(500);
        }
    }
    return "";
}

async function waitForServiceProperties(page: Page): Promise<string | null> {
    try {
        const bodyText = await readBodyTextWithRetry(page);

        if (bodyText.includes("user reports show problems with")) {
            return ServiceStatus.DANGER;
        }
        if (bodyText.includes("user reports show no current problems")) {
            return ServiceStatus.SUCCESS;
        }
        if (bodyText.includes("user reports show possible problems")) {
            return ServiceStatus.WARNING;
        }
        return null;
    } catch (error) {
        console.log(`waitForServiceProperties, Erro: ${(error as Error).message}`);
        return null;
    }
}

async function checkServiceStatus(page: Page, service: ServicesList): Promise<string | null> {
    await page.goto(service.url, { waitUntil: "domcontentloaded" });
    await waitForCloudflareChallenge(page);
    const outage = await waitForServiceProperties(page);

    if (!outage) {
        try {
            await page.screenshot({ path: `debug/${service.name}.png` });
        } catch {
            // pasta debug/ pode não existir — não é crítico.
        }
    }

    return outage;
}

export async function checkAllServices(): Promise<ServicesResult[]> {
    const results: ServicesResult[] = [];
    let browser: Browser | undefined;

    try {
        browser = (await Camoufox({
            headless: true,
            block_webrtc: true,
            window: [1280, 800],
        })) as Browser;

        for (const service of SERVICES) {
            const page = await browser.newPage();
            page.setDefaultTimeout(15000);
            page.setDefaultNavigationTimeout(15000);

            try {
                const outage = await checkServiceStatus(page, service);

                if (outage) {
                    results.push({ name: service.name, url: service.url, outage });
                    console.log(`💀 ${service.name}: ${outage}`);
                } else {
                    console.log(`${service.name} SEM STATUS ! (X.X)`);
                }
            } catch (error: any) {
                console.log(`${service.name}: ${error.message}`);
            } finally {
                await page.close();
            }
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return results;
}