import { ServiceStatus } from "./types.js";
import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";

const client = new WebClient(config.slack.botToken);

const servicesMax = 3;
let servicesInWarning: { name: string; url: string }[] = [];

export function registerWarningGlobal(bank: any): void {
    const status = bank.data.status;
    const service = bank.name;
    const url = bank.url;

    if (status === ServiceStatus.WARNING) {
        servicesInWarning.push({ name: service, url: url });
        console.log(`${service} EM WARNING | TOTAL: ${servicesInWarning.length}`);
    }
}

export async function checkWarningGlobal(): Promise<void> {
    if (servicesInWarning.length >= servicesMax) {
        
        let servicesList = "";
        for (const service of servicesInWarning) {
            servicesList += `• <${service.url}|${service.name}>\n`;
        }

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:warning: *Instabilidade detectada em ${servicesInWarning.length} serviços.*\n\n${servicesList}\n\n*Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` 
        });

        console.log(`[GLOBAL WARNING] ALERTA ENVIADO(${servicesInWarning.length} SERVIÇOS)`);
    }

    servicesInWarning = [];
}