import { ServiceStatus } from "./types.js";
import { WebClient } from "@slack/web-api";

export class WarningCollector {
    private maxWarnings: number = 3;
    private servicesInWarning: { name: string, url: string, serviceID: string }[] = [];
    private client: WebClient;
    private channel: string;
    private alreadyAlerted = new Set<string>();

    constructor(client: WebClient, channel: string) {
        this.client = client
        this.channel = channel
    }

    collect(services: any): void {
        const status = services.data.status;
        const service = services.name;
        const url = services.url;
        const serviceID = services.data.id;

        if (status !== ServiceStatus.WARNING) {
            this.alreadyAlerted.delete(serviceID);
            return;
        }

        if (this.alreadyAlerted.has(serviceID)) {
            return
        }

        this.servicesInWarning.push({
            name: service,
            url: url,
            serviceID: serviceID
        })
        this.alreadyAlerted.add(serviceID)
    }

    async check(): Promise<void> {
        if (this.servicesInWarning.length >= this.maxWarnings) {
            let servicesList = ""

            for (const service of this.servicesInWarning) {
                servicesList += `• <${service.url}|${service.name}>\n`;
            }

            await this.client.chat.postMessage({
                channel: this.channel,
                text: `:warning: *Instabilidade detectada em ${this.servicesInWarning.length} serviços.*\n${servicesList}*Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
            })
            console.log(`[GLOBAL WARNING] ALERTA ENVIADO(${this.servicesInWarning.length} SERVIÇOS)`);
        }
        this.servicesInWarning = [];
    }
}

