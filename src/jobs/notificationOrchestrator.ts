import { checkAllServices } from "../../providers/downdetector.js";
import { IncidentMonitor } from "../core/incidentMonitor.js";
import { ServiceName } from "../core/types.js";
import { config } from "../../config/env.js";
import { SlackNotifier } from "../../notifiers/slack.js";

const webhookErrorUrl: string[] = [config.slack.webhookErrorUrl];
const slackNotifier = new SlackNotifier(webhookErrorUrl);

const monitors = {} as Record<ServiceName, IncidentMonitor>;

for (const name of Object.values(ServiceName)) {
	monitors[name] = new IncidentMonitor();
}

export async function CheckAll() {
	const servicesResult = await checkAllServices();
	if (servicesResult.length === 0) {
		slackNotifier.sendError();
	}

	await Promise.all(
		servicesResult.map(async (services) => {
			const handler = monitors[services.name];
			if (handler) await handler.handle(services);
		}),
	);
}
