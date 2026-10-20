import { NewContext } from "camoufox";
import type { Browser, Page } from "playwright-core";
import { BrowserContext } from "playwright-core";
import { ServiceStatus } from "../core/types.js";
import type { ServiceResult, MonitoredService } from "../core/types.js";
import { SERVICES } from "../config/services.js";
import { launchBrowser } from "../providers/browser.js";
import { shuffleArray, sleep } from "../utils/helpers.js";
import { forceCloseBrowser } from "./closeBrowser.js";
// import { updateServiceStatus } from "../metrics/prometheusClient.js";
// import { normalizeServiceName } from "../metrics/prometheusClient.js";

const statusMap: Record<string, ServiceStatus> = {
	success: ServiceStatus.SUCCESS,
	warning: ServiceStatus.WARNING,
	danger: ServiceStatus.DANGER,
};

const statusIcon: Record<ServiceStatus, string> = {
	[ServiceStatus.SUCCESS]: "🟢",
	[ServiceStatus.WARNING]: "⚠️",
	[ServiceStatus.DANGER]: "🔴",
};

async function waitForRealContent(page: Page): Promise<boolean> {
	try {
		await page.waitForFunction(() => {
			const body = document.body?.innerText?.toLowerCase() || "";
			return (
				body.includes("relatos dos usuários") ||
				body.includes("relatos de usuários")
			);
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

async function checkSingleService(
	browser: Browser,
	service: MonitoredService,
): Promise<ServiceStatus | null> {
	const { name, url } = service;

	if (!browser.isConnected()) {
		console.log(`browser desconectado antes de checar: ${name}`);
		return null;
	}

	let page: Page | null = null;
	let context: BrowserContext | null = null;

	try {
		context = await NewContext(browser);
		page = await context.newPage();

		page.setDefaultTimeout(15000);
		page.setDefaultNavigationTimeout(15000);

		await page.setExtraHTTPHeaders({
			"Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
		});
		await page.goto(url, { waitUntil: "commit" });

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
			console.error(
				`Erro ao processar o serviço ${name}: ${error.message}`,
			);
		} else {
			console.error(`Erro bizarro no serviço ${name}:`, error);
		}
		return null;
	} finally {
		if (page && !page.isClosed())
			await page.close().catch((e) => {
				console.error(`erro ao fechar page: ${e.message}`);
			});
		if (context && !context?.isClosed())
			await context?.close().catch((e) => {
				console.error(`erro ao fechar context: ${e.message}`);
			});
	}
}

async function checkWithRetry(
	browser: Browser,
	service: MonitoredService,
): Promise<ServiceResult | null> {
	let status = await checkSingleService(browser, service);
	let retry: number = 0;

	while (!status && retry < 3) {
		retry++;
		const delay = Math.random() * (2000 - 1000) + 1000;
		await sleep(delay);
		status = await checkSingleService(browser, service);
	}

	if (!status) {
		return null;
	}

	return {
		name: service.name,
		url: service.url,
		outage: status,
	};
}

export async function checkAllServices(): Promise<ServiceResult[]> {
	let results: ServiceResult[] = [];
	const startTotal = Date.now();
	let browser: Browser | undefined;
	try {
		browser = await launchBrowser();
		const servicesToCheck = [...SERVICES];
		shuffleArray(servicesToCheck);
		for (let i = 0; i < servicesToCheck.length; i++) {
			const service = servicesToCheck[i];
			let status = await checkWithRetry(browser, service);
			if (status) {
				results.push(status);
			}
			if (i < servicesToCheck.length - 1) {
				const delay = Math.random() * (2000 - 1000) + 1000;
				await sleep(delay);
			}
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(`Erro completo do monitoramento:`, error);
		}
	} finally {
		await forceCloseBrowser(browser, 2000);
	}
	const totalTime = ((Date.now() - startTotal) / 1000).toFixed(1);
	console.log(
		`\n${results.length}/${SERVICES.length} serviços | ${totalTime}s`,
	);
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
