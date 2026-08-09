// src/scripts/testAlert.ts
import { WebClient } from "@slack/web-api";
import { IncidentMonitor } from "../slack/incidentMonitor.js";
import { ServiceName, ServiceURL, ServiceStatus } from "../slack/types.js";
import { config } from "../config/env.js";

const client = new WebClient(config.slack.botToken);
const monitor = new IncidentMonitor(client, config.slack.channel);

async function main() {
    console.log("Enviando alerta de teste (DANGER)...");
    await monitor.handle({
        name: ServiceName.PIX,
        url: ServiceURL.PIX,
        outage: ServiceStatus.DANGER,
    });

    console.log("Aguardando 1 minuto pra simular a duração do incidente...");
    await new Promise((resolve) => setTimeout(resolve, 60000));

    console.log("Enviando resolução de teste (SUCCESS)...");
    await monitor.handle({
        name: ServiceName.PIX,
        url: ServiceURL.PIX,
        outage: ServiceStatus.SUCCESS,
    });

    console.log("Feito! Confere o canal do Slack.");
}

main();