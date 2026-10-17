import { IncidentMonitor } from "../slack/incidentMonitor.js";
import { ServiceName, ServiceURL, ServiceStatus } from "../slack/types.js";

const monitor = new IncidentMonitor();

async function main() {
	await monitor.handle({
		name: ServiceName.PIX,
		url: ServiceURL.PIX,
		outage: ServiceStatus.DANGER,
	});

	await new Promise((resolve) => setTimeout(resolve, 60000));

	await monitor.handle({
		name: ServiceName.PIX,
		url: ServiceURL.PIX,
		outage: ServiceStatus.SUCCESS,
	});
}

main();
