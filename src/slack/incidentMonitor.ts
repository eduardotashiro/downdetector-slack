// import { ServiceStatus } from "./types.js";
// import { WebClient } from "@slack/web-api";
// import { config } from "../config/env.js";

// //form
// export class IncidentMonitor {
//     private incident: {
//         startedAt: number;
//         level: ServiceStatus;
//         alertSent: boolean;
//     } | null = null;

//     private client: WebClient;
//     private channel: string;

//     //ing form
//     constructor(client: WebClient, channel: string) {
//         this.client = client;
//         this.channel = channel
//     }

//     async handle(services: any): Promise<void> {
//         const status = services.data.status
//         const service = services.name

//         if (status === ServiceStatus.DANGER && !this.incident) {
//             this.incident = {
//                 startedAt: Date.now(),
//                 level: status,
//                 alertSent: false
//             }
//         }

//         await this.client.chat.postMessage({
//             channel: this.channel,
//             text: `:alert: *Nível Crítico - ${service}*\n\n• *Status:* \`critic\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
//         });

//             this.incident.alertSent = true;

//     }
// }




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

// boloChocolate.assar(); // 
// boloMorango.assar();   //