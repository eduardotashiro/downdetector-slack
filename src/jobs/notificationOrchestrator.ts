import { checkAllServices } from "../providers/downdetector.js";
import { IncidentMonitor } from "../core/incidentMonitor.js";
import { SERVICES } from "../config/services.js";
import { config } from "../config/env.js";
import { SlackNotifier } from "../notifiers/slack.js";
import type { ServiceResult } from "../core/types.js";

const webhooks: string[] = [config.slack.webhookUrl1, config.slack.webhookUrl2];

const slackNotifier = new SlackNotifier(webhooks);

const webhookErrorUrl: string[] = [config.slack.webhookErrorUrl];
const slackNotifierErr = new SlackNotifier(webhookErrorUrl);

const monitors = new Map<string, IncidentMonitor>();

for (const service of SERVICES) {
	monitors.set(service.name, new IncidentMonitor(slackNotifier));
}

export async function CheckAll() {
	const servicesResult = await checkAllServices();
	if (servicesResult.length === 0) {
		await slackNotifierErr.sendError();
	}

	await Promise.all(
		servicesResult.map(async (services: ServiceResult) => {
			const handler = monitors.get(services.name);
			if (handler) await handler.handle(services);
		}),
	);
}
