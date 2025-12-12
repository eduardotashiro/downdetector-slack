//import { checkPixStatus } from "../../pages/pix";
import { WebClient } from "@slack/web-api";
import { config } from "../../config/env";
import { Mock } from "../../testes/mock";

const client = new WebClient(config.slack.botToken);

let incidenteAtivo: {
    inicio: number;
    servico: string;
    messageTs?: string;
} | null = null;

let lastPeakTimestamp: string | null = null;

type ReportPoint = { x: string; y: number };

export async function sendSlackMessage() {
    const status = Mock; // await checkPixStatus();

    if (!status) {
        console.error("Não foi possível obter status do Pix");
        return;
    }

    const service = status?.company
    const statuss = status?.status;
    const reports: ReportPoint[] = status?.series?.reports?.data || [];


    let maxReportPoint = { x: "", y: 0 };
    for (let p of reports) {
        if (p.y > maxReportPoint.y) {
            maxReportPoint = p;
        }
    }

    const maxReport = maxReportPoint.y;
    const peakTimestamp = maxReportPoint.x; 
    const horarioRealPico = new Date(peakTimestamp).toLocaleString("pt-BR")


    //  WARNING
    // --------------------------------------------------------------------
    if (statuss === "warning" && !incidenteAtivo) {
        incidenteAtivo = {
            inicio: Date.now(),
            servico: service
        };

        const result = await client.chat.postMessage({
            channel: config.slack.channel,
            text: `Relatos de usuários indicam potenciais problemas com ${service} !\n\n` +
                `Incidente detectado às ${new Date().toLocaleString("pt-BR")}\n\n` +
                `<https://downdetector.com.br/fora-do-ar/pix/ | Acesse o Downdetector para mais informações>`
        });

        incidenteAtivo.messageTs = result.ts;
        console.log("🚨 Warning detectado!");
        return;
    }


    // RESOLVIDO
    // --------------------------------------------------------------------
    if (statuss === "success" && incidenteAtivo) {
        const duracao = Date.now() - incidenteAtivo.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;
        const duracaoTexto = horas > 0
            ? `${horas}h ${minutosRestantes}min`
            : `${minutosRestantes}min`;

        if (incidenteAtivo.messageTs) {
            await client.chat.postMessage({
                channel: config.slack.channel,
               // ts: incidenteAtivo.messageTs,
                text: `${service} Relatos de usuários indicam que não há problemas atuais com ${service} !\n\n` +
                    `Duração: ${duracaoTexto}\n\n` +
                    `Resolvido às ${new Date().toLocaleTimeString("pt-BR")}\n\n` + 
                    `<https://downdetector.com.br/fora-do-ar/pix/ | *Acesse o Downdetector para mais informações*>`
            });
        }

        console.log(`✅ Incidente resolvido: duração ${duracaoTexto}`);
        incidenteAtivo = null;
        return;
    }

    
    // Mais de 50 reclamações
    // --------------------------------------------------------------------
    if (maxReport > 50) {
        // Evita alertar o mesmo pico diversas vezes
        if (peakTimestamp && lastPeakTimestamp === peakTimestamp) {
            console.log("⚠️ Pico já alertado anteriormente. Ignorando.");
            return;
        }

        lastPeakTimestamp = peakTimestamp;

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `Pico de reclamações detectado no ${service}\n\n` +
                `Reclamações: ${maxReport}\n\n` +
                `Horário do pico: ${horarioRealPico}\n\n` + 
                `<https://downdetector.com.br/fora-do-ar/pix/ | Acesse o Downdetector para mais informações>`
        });

        console.log("🚨 Alerta de +50 reclamações enviado!");
        return;
    }


    // NORMAL
    // --------------------------------------------------------------------
    console.log(`${service} ok | Pico: ${maxReport} | Status: ${statuss} `);
}


