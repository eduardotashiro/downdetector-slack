import { IncidentMonitor } from "../src/core/incidentMonitor.js";
import { SERVICES } from "../src/config/services.js";
import { ServiceStatus } from "../src/core/types.js";
import { SlackNotifier } from "../src/notifiers/slack.js";
import { config } from "../src/config/env.js";

const webhooks: string[] = [config.slack.webhookUrl1, config.slack.webhookUrl2];

const slackNotifier = new SlackNotifier(webhooks)
const monitor = new IncidentMonitor(slackNotifier);

async function main() {
	await monitor.handle({
		name: SERVICES[0].name,
		url: SERVICES[0].url,
		outage: ServiceStatus.DANGER,
	});

	await new Promise((resolve) => setTimeout(resolve, 60000));

	await monitor.handle({
		name: SERVICES[0].name,
		url: SERVICES[0].url,
		outage: ServiceStatus.SUCCESS,
	});
}

main();
