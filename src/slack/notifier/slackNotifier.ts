import { checkPixStatus } from "../../pages/pix";
import { WebClient } from "@slack/web-api";
import { config } from "../../config/env";

const client = new WebClient(config.slack.botToken);

let incidenteAtivo: {
    inicio: number;
    servico: string;
    messageTs?: string; // salvar o timestamp da mensagem
} | null = null;

export async function sendSlackMessage() {
    const status = await checkPixStatus();

   if (!status) {
            console.error("❌ Não foi possível obter status do Pix");
            return;
        }

    const service = status?.company;
    const statuss = status?.status;

    // -----------------------------//
    // DETECÇÃO DE INCIDENTE
    // -----------------------------//
    
    // PROBLEMA COMEÇOU
    if (statuss === "warning" && !incidenteAtivo) {
        incidenteAtivo = {
            inicio: Date.now(),
            servico: service || "Serviço desconhecido"
        };

        const result = await client.chat.postMessage({
            channel: config.slack.channel,
            text: `🚨 *${service} ESTÁ FORA DO AR!*\n\nIncidente detectado às ${new Date().toLocaleTimeString('pt-BR')}`
        });

        // Salvar o timestamp da mensagem para editar depois
        incidenteAtivo.messageTs = result.ts;
        
        console.log("problema detectado!", new Date().toLocaleString('pt-BR'));
        return;
    }

    //  INCIDENTE RESOLVIDO
    if (statuss === "success" && incidenteAtivo) {
        const duracao = Date.now() - incidenteAtivo.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else {
            duracaoTexto = `${minutosRestantes}min`;
        }

        // Atualizar a mensagem original
        if (incidenteAtivo.messageTs) {
            await client.chat.update({
                channel: config.slack.channel,
                ts: incidenteAtivo.messageTs,
                text: `*${service} VOLTOU AO NORMAL!*\n\nDuração do incidente:*${duracaoTexto}*\nResolvido às ${new Date().toLocaleTimeString('pt-BR')}`
            });
        }

        console.log(`Incidente resolvido! Duração: ${duracaoTexto}`);
        
        incidenteAtivo = null;
        return;
    }

    if (statuss === "warning" && incidenteAtivo) {
        console.log("Incidente ainda ativo...");
        return;
    }

    // -----------------------------
    // VERIFICAÇÃO DE INSTABILIDADE
    // -----------------------------
    const reports = status?.series?.reports?.data || [];
    const baseline = status?.series?.baseline?.data || [];

    let maxReport = Math.max(...reports.map((p: { y: any; }) => p.y), 0);
    let maxBaseline = Math.max(...baseline.map((p: { y: any; }) => p.y), 0);

    if (maxReport > maxBaseline * 1.5) { // 50% acima do baseline
        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `⚠️ *${service} pode estar instável*\n\nPico de reclamações: ${maxReport} (baseline: ${maxBaseline})`
        });
        return;
    }


    // TUDO OK
    // -----------------------------
    console.log(`${service} está ok. Pico: ${maxReport} baseline: ${maxBaseline}`);
}