import { ServiceStatus } from "./types.js";
import { WebClient } from "@slack/web-api";


export class WarningCollector {
    private maxWarnings: number = 3;
    private servicesInWarning: { name: string, url: string }[] = [];
    private client: WebClient;
    private channel: string;

    constructor(client: WebClient, channel: string) {
        this.client = client
        this.channel = channel
    }

    collect(services: any): void {
        const status = services.data.status;
        const service = services.name;
        const url = services.url;

        if (status === ServiceStatus.WARNING)
            this.servicesInWarning.push({
                name: service,
                url: url
            })
        console.log(`${service} EM WARNING | TOTAL: ${this.servicesInWarning.length}`);
    }

    async check(): Promise<void> {
        if (this.servicesInWarning.length >= this.maxWarnings) {
            let servicesList = ""

            for (const service of this.servicesInWarning) {
                servicesList += `• <${service.url}|${service.name}>\n`;
            }

            await this.client.chat.postMessage({
                channel: this.channel,
                text: `:warning: *Instabilidade detectada em ${this.servicesInWarning.length} serviços.*\n\n${servicesList}\n\n*Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
            })
            console.log(`[GLOBAL WARNING] ALERTA ENVIADO(${this.servicesInWarning.length} SERVIÇOS)`);
        }
        this.servicesInWarning = [];
    }
}

