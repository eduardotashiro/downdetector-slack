import { checkAllServices } from "../services/downdetectorService.js";
import { IncidentMonitor } from "./incidentMonitor.js";
import { ServiceName } from "./types.js";
import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";

const client = new WebClient(config.slack.botToken);
const channel = config.slack.channel


const pixMonitor = new IncidentMonitor(client, channel);
const nubankMonitor = new IncidentMonitor(client, channel);
const bradescoMonitor = new IncidentMonitor(client, channel);
const santanderMonitor = new IncidentMonitor(client, channel);
const bbMonitor = new IncidentMonitor(client, channel);
const itauMonitor = new IncidentMonitor(client, channel);
const mercadoPagoMonitor = new IncidentMonitor(client, channel);
const picpayMonitor = new IncidentMonitor(client, channel);

const monitors = {
    [ServiceName.PIX]: pixMonitor,
    [ServiceName.NUBANK]: nubankMonitor,
    [ServiceName.BRADESCO]: bradescoMonitor,
    [ServiceName.SANTANDER]: santanderMonitor,
    [ServiceName.BANCO_DO_BRASIL]: bbMonitor,
    [ServiceName.ITAU]: itauMonitor,
    [ServiceName.MERCADO_PAGO]: mercadoPagoMonitor,
    [ServiceName.PICPAY]: picpayMonitor
};

export async function CheckAll() {

    const servicesResult = await checkAllServices();

    await Promise.all(servicesResult.map(async (services) => {
        const handler = monitors[services.name];
        if (handler) {
            await handler.handle(services);
        }
    }));

}