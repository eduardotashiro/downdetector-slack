import { checkPixStatus } from "../../pages/pix";
import { WebClient } from "@slack/web-api";
import { config } from "../../config/env";


const client = new WebClient(config.slack.botToken);

//memória
let incidenteAtivo: {
    inicio: number;
    servico: string;
    messageTs?: string;
} | null = null;

// Último pico notificado (para evitar duplicação)
let lastPeakTimestamp: string | null = null;

// Tipagem dos pontos do gráfico
type ReportPoint = { x: string; y: number };


export async function sendSlackMessage() {
    const status = await checkPixStatus();

    if (!status) {
        console.error("Não foi possível obter status do Pix");
        return;
    }

    const service = status?.company || "Pix";
    const statuss = status?.status;

    // ---- Coleta de séries ----
    const reports: ReportPoint[] = status?.series?.reports?.data || [];
    const baseline: ReportPoint[] = status?.series?.baseline?.data || [];

    // Maior ponto do gráfico
    const maxReportPoint = reports.reduce(
        (max: ReportPoint, p: ReportPoint) => (p.y > max.y ? p : max),
        { x: "", y: 0 }
    );

    const maxReport = maxReportPoint.y;
    const peakTimestamp = maxReportPoint.x;

    // Baseline máximo
    const maxBaseline = baseline.reduce(
        (max: ReportPoint, p: ReportPoint) => (p.y > max.y ? p : max),
        { x: "", y: 0 }
    ).y;

    // Converter horário real do pico
    const horarioRealPico = peakTimestamp
        ? new Date(peakTimestamp).toLocaleString("pt-BR")
        : "indefinido";


    // --------------------------------------------------------------------
    // 🚨 INCIDENTE WARNING (Downdetector detectou real instabilidade)
    // --------------------------------------------------------------------

    if (statuss === "warning" && !incidenteAtivo) {
        incidenteAtivo = {
            inicio: Date.now(),
            servico: service
        };

        const result = await client.chat.postMessage({
            channel: config.slack.channel,
            text: `🚨 *${service} ESTÁ FORA DO AR!*\n\n` +
                  `Incidente detectado às *${new Date().toLocaleTimeString("pt-BR")}*`
        });

        incidenteAtivo.messageTs = result.ts;

        console.log("🚨 Warning detectado!");
        return;
    }


  
    //INCIDENTE RESOLVIDO
    // --------------------------------------------------------------------

    if (statuss === "success" && incidenteAtivo) {
        const duracao = Date.now() - incidenteAtivo.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        const duracaoTexto = horas > 0 ? `${horas}h ${minutosRestantes}min`: `${minutosRestantes}min`;

        if (incidenteAtivo.messageTs) {
            await client.chat.update({
                channel: config.slack.channel,
                ts: incidenteAtivo.messageTs,
                text: `✅ *${service} VOLTOU AO NORMAL!*\n\n` +
                      `⏱️ Duração: *${duracaoTexto}*\n` +
                      `📅 Resolvido às ${new Date().toLocaleTimeString("pt-BR")}`
            });
        }

        console.log(`Incidente resolvido: duração ${duracaoTexto}`);
        incidenteAtivo = null;
        return;
    }


    
    //  ALERTA DE PICO  nível moderado
    // --------------------------------------------------------------------

    const LIMIAR_MODERADO = 2;  // pico é moderado se report > baseline * 2

    const picoModerado = maxReport > maxBaseline * LIMIAR_MODERADO;

    if (statuss === "success" && picoModerado) {

        // Evita alertar o mesmo pico diversas vezes
        if (peakTimestamp && lastPeakTimestamp === peakTimestamp) {
            console.log("Pico já alertado anteriormente. Ignorando.");
            return;
        }

        lastPeakTimestamp = peakTimestamp;

        await client.chat.postMessage({
            channel: config.slack.channel,
            text:
                `*:atenção: Pico de reclamações detectado no ${service}*\n\n` +
                `Reclamações: *${maxReport}*\n` +
               // `Baseline: ${maxBaseline}\n\n` +
                `*Horário do pico:* ${horarioRealPico}\n` 
                // `Status oficial: ${statuss}`
        });

        console.log(" Alerta de pico moderado enviado!");
        return;
    }



    // LOG NORMAL
    // --------------------------------------------------------------------

    console.log(
        `✔️ ${service} ok | Pico: ${maxReport} | Baseline: ${maxBaseline} | Status: ${statuss}`
    );
}
