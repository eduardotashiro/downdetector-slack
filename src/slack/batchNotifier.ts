import { checkWarningGlobal, registerWarningGlobal } from "./warningGlobal.js";
import { ServiceName, ServiceStatus } from "./types.js";
import { checkAllServices } from "../pages/batchPages.js";
import { IncidentMonitor } from "./incidentMonitor.js";
import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";

const client = new WebClient(config.slack.botToken)


const pixMonitor = new IncidentMonitor(client, config.slack.channel)
const nubankMonitor = new IncidentMonitor(client, config.slack.channel)
const bradescoMonitor = new IncidentMonitor(client, config.slack.channel)
const santanderMonitor = new IncidentMonitor(client, config.slack.channel)
const bbMonitor = new IncidentMonitor(client, config.slack.channel)
const itauMonitor = new IncidentMonitor(client, config.slack.channel)
const mercadoPagoMonitor = new IncidentMonitor(client, config.slack.channel)
const picpayMonitor = new IncidentMonitor(client, config.slack.channel)

export async function CheckAll() {

    const allData = await checkAllServices();

    for (const bank of allData) {
        registerWarningGlobal(bank);
    }

    for (const bank of allData) {
        if (bank.name === ServiceName.PIX) {
            await pixMonitor.handle(bank)
        }
        else if (bank.name === ServiceName.NUBANK) {
            await nubankMonitor.handle(bank)
        }
        else if (bank.name === ServiceName.BRADESCO) {
            await bradescoMonitor.handle(bank)
        }
        else if (bank.name === ServiceName.SANTANDER) {
            await santanderMonitor.handle(bank)
        }
        else if (bank.name === ServiceName.BANCO_DO_BRASIL) {
            await bbMonitor.handle(bank)
        }
        else if (bank.name === ServiceName.ITAU) {
            await itauMonitor.handle(bank)
        }
        else if (bank.name === ServiceName.MERCADO_PAGO) {
            await mercadoPagoMonitor.handle(bank)
        }
        else if (bank.name === ServiceName.PICPAY) {
            await picpayMonitor.handle(bank)
        }
    }

    await checkWarningGlobal();

}