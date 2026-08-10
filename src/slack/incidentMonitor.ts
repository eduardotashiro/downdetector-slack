import { WebClient } from "@slack/web-api";
import { ServicesResult } from "../services/downdetectorService.js";
import { ServiceStatus } from "./types.js";

export class IncidentMonitor {
    private incident: {
        startedAt: number;
        level: ServiceStatus;
        alertSent: boolean;
    } | null = null;

    private client: WebClient;
    private channel: string;

    constructor(client: WebClient, channel: string) {
        this.client = client;
        this.channel = channel
    }

    async handle(services: ServicesResult): Promise<void> {
        const { name, url, outage: status } = services

        if (status === ServiceStatus.DANGER && !this.incident) {
            this.incident = {
                startedAt: Date.now(),
                level: status,
                alertSent: false
            }

            await this.client.chat.postMessage({
                channel: this.channel,
                text: `:alert: *Nível Crítico - ${name}*\n\n• *Status:* \`critic\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${url} | Ver no Downdetector>`
            });

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
            const incidentStart = new Date(this.incident.startedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
            const endOfIncident = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })

            await this.client.chat.postMessage({
                channel: this.channel,
                text: `:white_check_mark: *Normalizado* - *${name}*\n\n• *Status:* \`resolved\`\n• *Detectado em:* ${incidentStart}\n• *Fim:* ${endOfIncident}\n• *Duração:* ${timeText}\n\n<${url} | Ver no Downdetector>`
            });
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

        if (status === ServiceStatus.SUCCESS && !this.incident) {
            console.log(`${name} 🟢`)
        }
    }
}