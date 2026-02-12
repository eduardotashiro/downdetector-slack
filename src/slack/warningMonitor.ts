import { ServiceStatus } from "./types.js";
import { WebClient } from "@slack/web-api";
import { ServicesResult } from "../pages/batchPages.js";

export class WarningCollector {
    private maxWarnings: number = 3;
    private timeWindow: number = 5 * 60 * 1000; 

    private servicesInWarning: {
        name: string,
        url: string,
        serviceID: number,
        firstSeenAt: number 
    }[] = [];

    private client: WebClient;
    private channel: string;

    constructor(client: WebClient, channel: string) {
        this.client = client;
        this.channel = channel;
    }

    collect(services: ServicesResult): void {
        const { name, url, data: { status, id: serviceID } } = services;

        if (status !== ServiceStatus.WARNING) {
            // Remove da lista se voltou ao normal
            this.servicesInWarning = this.servicesInWarning.filter(
                s => s.serviceID !== serviceID
            );
            return;
        }

        // Verifica se já está na lista
        const alreadyExists = this.servicesInWarning.some(
            s => s.serviceID === serviceID
        );

        if (!alreadyExists) {
            this.servicesInWarning.push({
                name,
                url,
                serviceID,
                firstSeenAt: Date.now()
            });
        }
    }

    async check(): Promise<void> {
        const now = Date.now();

        // Remove warnings fora da janela de tempo
        this.servicesInWarning = this.servicesInWarning.filter(
            service => now - service.firstSeenAt <= this.timeWindow
        );

        // Só alerta se tiver 3+ warnings DENTRO da janela
        if (this.servicesInWarning.length >= this.maxWarnings) {
            let servicesList = "";

            for (const service of this.servicesInWarning) {
                const minutesAgo = Math.floor((now - service.firstSeenAt) / 60000);
                servicesList += `• <${service.url}|${service.name}> (há ${minutesAgo}min)\n`;
            }

            await this.client.chat.postMessage({
                channel: this.channel,
                text: `:warning: *Instabilidade detectada em ${this.servicesInWarning.length} serviços (últimos 5min).*\n${servicesList}*Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
            });

            console.log(`[GLOBAL WARNING] ALERTA ENVIADO (${this.servicesInWarning.length} SERVIÇOS NA JANELA DE 5MIN)`);
            
            // Limpa a lista após alertar
            this.servicesInWarning = [];
        }
    }
}