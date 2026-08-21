import { Camoufox } from "camoufox-js";
import type { Browser, Page } from "playwright-core";
import { ServiceName, ServiceURL, ServiceStatus } from "../slack/types.js";
import { sendEphemeralMessage } from "../slack/scraperErrorAlert.js"
import { updateServiceStatus } from "../metrics/prometheusClient.js";
import { normalizeServiceName } from "../metrics/prometheusClient.js";

export interface ServicesResult {
    name: ServiceName;
    url: ServiceURL;
    outage: string;
}

interface ServicesList {
    name: ServiceName;
    url: ServiceURL;
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

async function waitForRealContent(page: Page, maxWait: number = 15000): Promise<boolean> {

    const deadline = Date.now() + maxWait;

    while (Date.now() < deadline) {

        const body = await page
            .evaluate(() => document.body?.innerText?.toLowerCase() || "")
            .catch(() => "");

        if (
            body.includes("relatos dos usuários") ||
            body.includes("relatar um problema") ||
            body.includes("user reports show") ||
            body.includes("report a problem")
        ) {
            return true;
        }

        if (
            body.includes("verificando") ||
            body.includes("verifying") ||
            body.includes("segurança") ||
            body.includes("confirme que é humano")
        ) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return false;
}

async function detectStatus(page: Page): Promise<string | null> {

    try {

        const body = await page.evaluate(
            () => document.body?.innerText?.toLowerCase() || ""
        );

        if (
            body.includes("não mostram problemas") ||
            body.includes("no current problems")
        ) {
            return ServiceStatus.SUCCESS;
        }

        if (
            body.includes("possíveis problemas") ||
            body.includes("possible problems")
        ) {
            return ServiceStatus.WARNING;
        }

        if (
            body.includes("mostram problemas") ||
            body.includes("show problems with")
        ) {
            return ServiceStatus.DANGER;
        }

        return null;

    } catch {
        return null;
    }
}

async function checkSingleService(browser: Browser, service: ServicesList): Promise<string | null> {

    const name = service.name;
    const url = service.url;

    let page: Page | undefined;

    try {

        console.log(`💀 ${name}...`);

        page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            "Accept-Language":
                "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        });

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 45000,
        });

        const loaded = await waitForRealContent(
            page,
            15000
        );

        if (!loaded) {
            console.log("❌");
            return null;
        }

        const status = await detectStatus(page);

        if (status === ServiceStatus.SUCCESS) {
            console.log("✅");
        } else if (status === ServiceStatus.WARNING) {
            console.log("⚠️");
        } else if (status === ServiceStatus.DANGER) {
            console.log("🔴");
        } else {
            console.log("❓");
        }

        return status;

    } catch (error) {

        const message = error instanceof Error ? error.message : String(error);

        console.log(`❌ (${message.slice(0, 30)})`);

        return null;

    } finally {

        if (page) {
            await page.close().catch(() => { });
        }
    }
}

export async function checkAllServices(): Promise<ServicesResult[]> {

    const results: ServicesResult[] = [];

    const startTotal = Date.now();

    let browser: Browser | undefined;

    try {

        console.log("Iniciando Camoufox...");

        browser = (await Camoufox({
            headless: "virtual",
            os: "linux",
            humanize: true,
            geoip: true,
            block_webrtc: true,
            window: [1920, 1080],
        })) as Browser;

        console.log("Camoufox iniciado!");

        const servicesToCheck = [...SERVICES];

        servicesToCheck.sort(() => Math.random() - 0.5);

        for (let i = 0; i < servicesToCheck.length; i++) {

            const service = servicesToCheck[i];

            let status = await checkSingleService(
                browser,
                service
            );

            if (!status) {

                await new Promise(resolve =>
                    setTimeout(resolve, 1500)
                );

                status = await checkSingleService(
                    browser,
                    service
                );
            }

            if (status) {

                results.push({
                    name: service.name,
                    url: service.url,
                    outage: status,
                });
            }

            if (i < servicesToCheck.length - 1) {

                const delay = Math.random() * (3000 - 1500) + 1500;

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );
            }
        }

        if (results.length === 0) {
            const errorMessage = `Nenhum serviço foi verificado`;
            await sendEphemeralMessage(errorMessage);
        }

    } finally {

        if (browser) {
            await browser.close().catch(() => { });
        }
    }

    const totalTime = ((Date.now() - startTotal) / 1000).toFixed(1);

    console.log(`\n${results.length}/${SERVICES.length} serviços | ${totalTime}s`);

    const statusMap: { [key: string]: number } = {
        'success': 0,
        'warning': 1,
        'danger': 2
    };

    for (let i = 0; i < results.length; i++) {
        const service = normalizeServiceName(results[i].name);
        const statusValue = results[i].outage;
        const statusNum = statusMap[statusValue];
        updateServiceStatus(service, statusNum);
    }

    return results;
}