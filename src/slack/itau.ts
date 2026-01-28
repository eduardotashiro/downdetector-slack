import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";
import { ServiceStatus } from "./types.js";

const client = new WebClient(config.slack.botToken);

let itauIncidente: {
    inicio: number;
    nivel: ServiceStatus;
    alertaEnviado: boolean;
} | null = null;

/*-*-*-*-*-*-*-* INICIO ITAU *-*-*-*-*-*-*-*/
export async function tratarItau(services: any) {
    const dados = services.dados;
    const status = dados.status;
    const service = dados?.company

    /*-*-*-*-*-*-*-* WARNING *-*-*-*-*-*-*-*/
    if ((status === ServiceStatus.WARNING) && !itauIncidente) {
        itauIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} DETECTADO ! | INICIANDO CONTAGEM...`)
        return
    }

    if (status === ServiceStatus.WARNING && itauIncidente && !itauIncidente.alertaEnviado) {
        itauIncidente.nivel = ServiceStatus.WARNING

        const tempInterv: number = Date.now() - itauIncidente.inicio;
        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} NÃO COMPLETOU 1H !`)
            return
        }

        const emoji = ":warning:";
        const txt = "Instabilidade";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emoji} *${txt} - ${service}*\n\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(itauIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
        });

        itauIncidente.alertaEnviado = true;

        console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} ENVIADO NO SLACK !`);
        return;
    }


    /*-*-*-*-*-*-*-* WARNING *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.WARNING && itauIncidente?.nivel === ServiceStatus.DANGER) {
        console.log(`INSTABILIDADE EM ${service} FOI DE ${ServiceStatus.DANGER} PARA ${ServiceStatus.WARNING}, SEGUIMOS MONITORANDO !`)
        return
    }


    /*-*-*-*-*-*-*-* DANGER *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.DANGER && !itauIncidente) {
        itauIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        const emojii = ":alert:";
        const txtt = "critic";
        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
        });
        itauIncidente.alertaEnviado = true;
        console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} ENVIADO NO SLACK !`);
        return;
    }


    /*-*-*-*-*-*-*-* WARNING -> DANGER *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.DANGER && itauIncidente && itauIncidente.nivel === ServiceStatus.WARNING) {
        itauIncidente.nivel = ServiceStatus.DANGER;

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
        });

        console.log(`STATUS ${ServiceStatus.DANGER} PARA ${service} ENVIADO NO SLACK !`);

        itauIncidente.alertaEnviado = true
        return;
    }


    /*-*-*-*-*-*-*-* WARNING || DANGER e volta para o SUCCESS *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.SUCCESS && itauIncidente && itauIncidente.nivel === ServiceStatus.WARNING && !itauIncidente.alertaEnviado) {
        itauIncidente.nivel = ServiceStatus.SUCCESS
        console.log(`${service} - OSCILAÇÃO DETECTADA, ZERANDO CONTAGEM !`)

        itauIncidente = null
    }

    /*-*-*-*-*-*-*-* PROBLEMA RESOLVIDO (volta pra success) *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.SUCCESS && itauIncidente && itauIncidente.alertaEnviado) {
        const duracao = Date.now() - itauIncidente.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        } 

        const inicioIncidente = new Date(itauIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *Normalizado* - *${service}*\n\n• *Status:* \`resolved\`\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | Ver no Downdetector>`
        });

        console.log(`INCIDENTE NO ${service} RESOLVIDO ! DURAÇÃO: ${duracaoTexto}`);

        itauIncidente = null;
        return;
    }


    /*-*-*-*-*-*-*-* INCIDENTE JÁ ATIVO (não faz nada, só monitora) *-*-*-*-*-*-*-*/
    if ((status === ServiceStatus.WARNING || status === ServiceStatus.DANGER) && itauIncidente) {
        console.log(`INCIDENTE EM ${service} | STATUS: ${status} AINDA ATIVO...`);
        return;
    }

    /*-*-*-*-*-*-*-* TUDO OK *-*-*-*-*-*-*-*/
    console.log(`${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_paulo" })} | ${service} OK | Status: ${status}`);
}
/*-*-*-*-*-*-*-* FIM ITAU *-*-*-*-*-*-*-*/