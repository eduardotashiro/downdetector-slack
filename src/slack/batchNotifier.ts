import { checkAllServices } from "../pages/batchPages.js";
import { IncidentMonitor } from "./incidentMonitor.js";
import { WarningCollector } from "./warningMonitor.js";
import { ServiceName } from "./types.js";
import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";

const client = new WebClient(config.slack.botToken);

const warningStatus = new WarningCollector(client, config.slack.channel);

const pixMonitor = new IncidentMonitor(client, config.slack.channel);
const nubankMonitor = new IncidentMonitor(client, config.slack.channel);
const bradescoMonitor = new IncidentMonitor(client, config.slack.channel);
const santanderMonitor = new IncidentMonitor(client, config.slack.channel);
const bbMonitor = new IncidentMonitor(client, config.slack.channel);
const itauMonitor = new IncidentMonitor(client, config.slack.channel);
const mercadoPagoMonitor = new IncidentMonitor(client, config.slack.channel);
const picpayMonitor = new IncidentMonitor(client, config.slack.channel);

export async function CheckAll() {

    const servicesResult = await checkAllServices();

    for (const services of servicesResult) {
        warningStatus.collect(services);
    }

    for (const services of servicesResult) {
        if (services.name === ServiceName.PIX) {
            await pixMonitor.handle(services);
        }
        else if (services.name === ServiceName.NUBANK) {
            await nubankMonitor.handle(services);
        }
        else if (services.name === ServiceName.BRADESCO) {
            await bradescoMonitor.handle(services);
        }
        else if (services.name === ServiceName.SANTANDER) {
            await santanderMonitor.handle(services);
        }
        else if (services.name === ServiceName.BANCO_DO_BRASIL) {
            await bbMonitor.handle(services);
        }
        else if (services.name === ServiceName.ITAU) {
            await itauMonitor.handle(services);
        }
        else if (services.name === ServiceName.MERCADO_PAGO) {
            await mercadoPagoMonitor.handle(services);
        }
        else if (services.name === ServiceName.PICPAY) {
            await picpayMonitor.handle(services);
        }
    }

    await warningStatus.check();

}