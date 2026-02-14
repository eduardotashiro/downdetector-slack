import { ServiceStatus } from "./types.js";
import { WebClient } from "@slack/web-api";
import { ServicesResult } from "../pages/batchPages.js";

//form
export class IncidentMonitor {
    private incident: {
        startedAt: number;
        level: ServiceStatus;
        alertSent: boolean;
    } | null = null;

    private client: WebClient;
    private channel: string;

    //ing form
    constructor(client: WebClient, channel: string) {
        this.client = client;
        this.channel = channel
    }
    //metho
    async handle(services: ServicesResult): Promise<void> {
        const { name, url, data: { status } } = services

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
            console.log(`STATUS ${ServiceStatus.DANGER} PARA ${name} ENVIADO NO SLACK !`);
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

        if ((status === ServiceStatus.DANGER) && this.incident) {
            console.log(`INCIDENTE EM ${name} | STATUS: ${status}, AINDA ATIVO...`);
            return;
        }
    }
}

































// class Bolo {
//     sabor: string;
//     peso: number;

//     constructor(sabor: string, peso: number) {
//         this.sabor = sabor;
//         this.peso = peso;
//     }

//     assar() {
//         console.log(`Assando bolo de ${this.sabor}...`);
//     }
// }

// const boloChocolate = new Bolo("chocolate", 500);
// const boloMorango = new Bolo("morango", 300);

// boloChocolate.assar();
// boloMorango.assar();   









// class JogadorDeBasquete {
//     velocidade: number;
//     habilidade: number;
//     altura: float;
//     enterrada: boolean;
//     nome: string;
//     time: string;


//     constructor(velocidade: number,habilidade: number, altura: float , enterrada: boolean, nome: string, time : string) {
//         this.velocidade = velocidade;
//         this.habilidade = habilidade;
//         this.altura = altura;
//         this.enterrada = enterrada;
//         this.nome = string;
//         this.time = string;
//     }

//     chamaJogador() {
//         console.log(`chamando o jogador ${this.nome} para jogar no ${this.time}...`);
//     }
//    expulsaJogadorMuitoRuim(){
//          console.log(`não sobra nada pro ${this.nome}`)
//       }
// }

// const jogadorQualquer = new JogadorDeBasquete(1, 2, 1.50, false, "joao", "Bauru");
// const duduTheKing = new JogadorDeBasquete("100", 200, 2.00, true, "Dudu", "Cleveland");

// duduTheKing.chamaJogador()
// jogadorQualquer.expulsaJogadorMuitoRuim() 