import { WebClient } from "@slack/web-api";
import { IncidentMonitor } from "../slack/incidentMonitor.js";
import { ServiceName, ServiceURL, ServiceStatus } from "../slack/types.js";
import { config } from "../config/env.js";

const client = new WebClient(config.slack.botToken);
const monitor = new IncidentMonitor(client, config.slack.channel);

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