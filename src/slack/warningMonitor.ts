import { ServiceStatus, ServiceName, ServiceURL } from "./types.js";
import { WebClient } from "@slack/web-api";
import { ServicesResult } from "../pages/batchPages.js";

export class WarningCollector {
    private maxWarnings: number = 3;
    private timeWindow: number = 5 * 60 * 1000; // two sessions time

    private servicesInWarning: {
        name: ServiceName,
        url: ServiceURL,
        id: number,
        firstSeenAt: number
    }[] = [];

    private client: WebClient;
    private channel: string;

    constructor(client: WebClient, channel: string) {
        this.client = client;
        this.channel = channel;
    }

    collect(services: ServicesResult): void {
        const { name, url, data: { status, id } } = services;

        if (status !== ServiceStatus.WARNING) {
            this.removeService(id);
            return;
        }

        const alreadyExists = this.servicesInWarning.some(
            s => s.id === id
        );

        if (!alreadyExists) {
            this.servicesInWarning.push({
                name,
                url,
                id,
                firstSeenAt: Date.now()
            });
        }
    }

    async check(): Promise<void> {
        this.cleanOldWarnings();

        if (this.servicesInWarning.length >= this.maxWarnings) {
            const servicesList = this.servicesInWarning.map(service => `• <${service.url}|${service.name}>`).join("\n")


            await this.client.chat.postMessage({
                channel: this.channel,
                text: `:warning: *Instabilidade geral detectada em ${this.servicesInWarning.length} serviços em warning simultaneamente.*\n${servicesList}*Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`});

            console.log(`[GLOBAL WARNING] ALERTA ENVIADO (${this.servicesInWarning.length} SERVIÇOS SIMULTANEAMENTE)`);

            this.servicesInWarning = [];
        }
    }

    private cleanOldWarnings(): void {
        const now = Date.now();
        this.servicesInWarning = this.servicesInWarning.filter(service => now - service.firstSeenAt <= this.timeWindow)
    }

    private removeService(id: number) {
        this.servicesInWarning = this.servicesInWarning.filter(s => s.id !== id);
    }
}