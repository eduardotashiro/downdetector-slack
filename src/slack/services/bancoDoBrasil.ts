import { WebClient } from "@slack/web-api";
import { config } from "../../config/env.js";
import { ServiceStatus } from "../types.js";

const client = new WebClient(config.slack.botToken);

let BancoDoBrasilIncident: {
    startedAt: number;
    level: ServiceStatus;
    alertSent: boolean;
} | null = null;

/*-*-*-*-*-*-*-* INICIO BB *-*-*-*-*-*-*-*/
export async function handleBancoDoBrasil(services: any): Promise<void> {
    const data = services.data;
    const status = data.status;
    const service = services.name;

    /*-*-*-*-*-*-*-* DANGER *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.DANGER && !BancoDoBrasilIncident) {
        BancoDoBrasilIncident = {
            startedAt: Date.now(),
            level: status,
            alertSent: false
        }

        const emojii = ":alert:";
        const txtt = "critic";
        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
        });
        BancoDoBrasilIncident.alertSent = true;
        console.log(`STATUS ${ServiceStatus.DANGER} PARA ${service} ENVIADO NO SLACK !`);
        return;
    }

    /*-*-*-*-*-*-*-* PROBLEMA RESOLVIDO (volta pra success) *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.SUCCESS && BancoDoBrasilIncident && BancoDoBrasilIncident.alertSent) {
        const duracao = Date.now() - BancoDoBrasilIncident.startedAt;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        }

        const inicioIncidente = new Date(BancoDoBrasilIncident.startedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *Normalizado* - *${service}*\n\n• *Status:* \`resolved\`\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | Ver no Downdetector>`
        });

        console.log(`INCIDENTE NO ${service} RESOLVIDO ! DURAÇÃO: ${duracaoTexto}`);

        BancoDoBrasilIncident = null;
        return;
    }

    /*-*-*-*-*-*-*-* INCIDENTE JÁ ATIVO (não faz nada, só monitora) *-*-*-*-*-*-*-*/
    if ((status === ServiceStatus.DANGER) && BancoDoBrasilIncident) {
        console.log(`INCIDENTE EM ${service} | STATUS: ${status} AINDA ATIVO...`);
        return;
    }
}
/*-*-*-*-*-*-*-* FIM BB *-*-*-*-*-*-*-*/