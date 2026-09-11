import { WebClient } from "@slack/web-api";
import { ServicesResult } from "../services/downdetectorService.js";
import { ServiceStatus } from "./types.js";

export class IncidentMonitor {
    private incident: {
        startedAt: number;
        alertSent: boolean;
    } | null = null;

    private client: WebClient;
    private channels: string[];

    constructor(client: WebClient, channels: string[]) {
        this.client = client;
        this.channels = channels;
    }

    async handle(services: ServicesResult): Promise<void> {
        const { name, url, outage: status } = services

        if (status === ServiceStatus.DANGER && !this.incident) {
            this.incident = {
                startedAt: Date.now(),
                alertSent: false
            }

            const text: string = `:alert: *Nível Crítico - ${name}*\n\n• *Status:* \`critic\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(",", " às")}\n\n<${url} | Ver no Downdetector>`;
            await Promise.all(this.channels.map(channel => this.client.chat.postMessage({ channel, text })));

            this.incident.alertSent = true;
            console.log(`STATUS ${ServiceStatus.DANGER} 🔴 PARA ${name} ENVIADO NO SLACK !`);
            return;
        }

        if (status === ServiceStatus.SUCCESS && this.incident && this.incident.alertSent) {
            const time = Date.now() - this.incident.startedAt
            const minutes = Math.floor(time / 60000);
            const hours = Math.floor(minutes / 60);
            const minutesRemaining = minutes % 60;

            let timeText = "";
            if (hours > 0) {
                timeText = `${hours}h ${minutesRemaining}min`
            } else if (minutes > 0) {
                timeText = `${minutes}min`;
            }
            const incidentStart = new Date(this.incident.startedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(",", " às");
            const endOfIncident = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(",", " às");

            const text : string = `:white_check_mark: *Normalizado* - *${name}*\n\n• *Status:* \`resolved\`\n• *Detectado em:* ${incidentStart}\n• *Fim:* ${endOfIncident}\n• *Duração:* ${timeText}\n\n<${url} | Ver no Downdetector>`;
            await Promise.all(this.channels.map(channel => this.client.chat.postMessage({ channel, text })));
  
            console.log(`INCIDENTE NO ${name} RESOLVIDO ! DURAÇÃO: ${timeText}`);

            this.incident = null;
            return;
        }

        if (status === ServiceStatus.WARNING) {
            console.log(`⚠️ ${name}: possíveis problemas (warning)`);
            return;
        }

        if ((status === ServiceStatus.DANGER) && this.incident) {
            console.log(`INCIDENTE EM ${name} | STATUS: ${status}, AINDA ATIVO...`);
            return;
        }
    }
}