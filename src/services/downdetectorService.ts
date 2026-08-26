import { Camoufox } from "camoufox-js";
import type { Browser, Page } from "playwright-core";
import { BrowserContext } from 'playwright-core'
import { ServiceName, ServiceURL, ServiceStatus } from "../slack/types.js";
import { sendEphemeralMessage } from "../slack/scraperErrorAlert.js"
import treeKill from "tree-kill";
// import { updateServiceStatus } from "../metrics/prometheusClient.js";
// import { normalizeServiceName } from "../metrics/prometheusClient.js";

export interface ServicesResult {
    name: ServiceName;
    url: ServiceURL;
    outage: ServiceStatus;
}

interface ServicesList {
    name: ServiceName;
    url: ServiceURL;
}

const statusMap: Record<string, ServiceStatus> = {
    success: ServiceStatus.SUCCESS,
    warning: ServiceStatus.WARNING,
    danger: ServiceStatus.DANGER
}

const statusIcon: Record<ServiceStatus, string> = {
    [ServiceStatus.SUCCESS]: "🟢",
    [ServiceStatus.WARNING]: "⚠️",
    [ServiceStatus.DANGER]: "🔴"
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


function shuffleArray(array: ServicesList[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function killProcessTree(pid: number, signal: "SIGTERM" | "SIGKILL"): Promise<void> {
    return new Promise((resolve) => {
        treeKill(pid, signal, (err) => {
            if (err) console.log(`treeKill(${pid}): ${err.message}`); // normal quando o processo já morreu sozinho, não é erro fatal
            resolve();
        });
    });
}


export async function forceCloseBrowser(browser?: Browser, timeoutMs: number = 3000): Promise<void> {
    if (!browser) return;
    const proc = (browser as Browser & { process?: () => { pid?: number } }).process?.();
    const pid = proc?.pid;
    const normalClose = async () => {
        if (browser.isConnected()) await browser.close();
    };
    let timeoutId: NodeJS.Timeout | null = null;
    const timedOut = await Promise.race([
        normalClose().then(() => false).catch(() => false),
        new Promise<boolean>((resolve) => { timeoutId = setTimeout(() => resolve(true), timeoutMs); }),
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    if (!timedOut && !browser.isConnected()) return;
    console.log(`browser não fechou normalmente, timeout=${timedOut}), matando árvore de processos`);
    if (pid) {
        await killProcessTree(pid, "SIGKILL");
    } else if (timedOut || browser.isConnected()) {
        console.error("não foi possível obter o pid do browser para matar a árvore de processos...");
    }
}


async function waitForRealContent(page: Page): Promise<boolean> {
    try {
        await page.waitForFunction(() => {
            const body = document.body?.innerText?.toLowerCase() || "";
            return body.includes("relatos dos usuários") || body.includes("relatos de usuários");
        });
        return true;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`tempo esgotado ou erro: ${error.message}`);
        } else {
            console.error(`erro bizarro: ${error}`);
        }
        return false;
    }
}


async function detectStatus(page: Page): Promise<ServiceStatus | null> {
    try {
        const JSHandle = await page.waitForFunction(() => {
            const body = document.body?.innerText?.toLowerCase() || "";
             if (body.includes("não mostram problemas")) return "success";
              if (body.includes("possíveis problemas")) return "warning";
               if (body.includes("mostram problemas")) return "danger";
                return false;
        });
        const statusString = await JSHandle.jsonValue();
        if (!statusString) return null;
        return statusMap[statusString];
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`tempo esgotado ou erro: ${error.message}`);
        } else {
            console.error(`erro bizarro: ${error}`);
        }
        return null;
    }
}


async function checkSingleService(browser: Browser, service: ServicesList): Promise<ServiceStatus | null> {
    const { name, url } = service;

    if (!browser.isConnected()) {
        console.log(`browser desconectado antes de checar: ${name}`)
        return null
    }

    let page: Page | null = null;
    let context: BrowserContext | null = null;

    try {
        context = await browser.newContext();
        page = await context.newPage();
        page.setDefaultTimeout(15000);
        page.setDefaultNavigationTimeout(15000);
        await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" });
        await page.goto(url, { waitUntil: "domcontentloaded" });
        const loaded = await waitForRealContent(page);
        if (!loaded) {
            console.log(`💀 ${name}...❌ _cf_`);
            return null;
        }
        const status = await detectStatus(page);
        if (!status) return null;
        console.log(`💀 ${name}...${statusIcon[status]}`);
        return status;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`erro: ${error.message}`);
        } else {
            console.error("erro bizarro:", error);
        }
        return null;
    } finally {
        if (context && !context?.isClosed()) await context?.close().catch((e) => { console.error(`erro ao fechar context: ${e.message}`); });
    }
}


export async function checkAllServices(): Promise<ServicesResult[]> {
    const results: ServicesResult[] = [];
    const startTotal = Date.now();
    let browser: Browser | undefined;
    try {

        browser = (await Camoufox({
            headless: false,
            os: "linux",
            humanize: true,
            geoip: true,
            block_webrtc: true,
            window: [1920, 1080],
        })) as Browser;

        console.log("\nCamoufox iniciado!");
        const servicesToCheck = [...SERVICES];
        shuffleArray(servicesToCheck);
        for (let i = 0; i < servicesToCheck.length; i++) {
            const service = servicesToCheck[i];
            let status = await checkSingleService(browser, service);
            if (!status) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                status = await checkSingleService(browser, service);
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
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        if (results.length === 0) {
            const errorMessage = `Nenhum serviço foi verificado`;
            await sendEphemeralMessage(errorMessage);
        }
    } finally {
        await forceCloseBrowser(browser, 3000);
    }
    const totalTime = ((Date.now() - startTotal) / 1000).toFixed(1);
    console.log(`\n${results.length}/${SERVICES.length} serviços | ${totalTime}s`);

    // const statusMap: { [key: string]: number } = {
    //     'success': 0,
    //     'warning': 1,
    //     'danger': 2
    // };

    // for (let i = 0; i < results.length; i++) {
    //     const service = normalizeServiceName(results[i].name);
    //     const statusValue = results[i].outage;
    //     const statusNum = statusMap[statusValue];
    //     updateServiceStatus(service, statusNum);
    // }

    return results;
}