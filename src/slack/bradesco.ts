import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";
import { ServiceStatus } from "./types.js";

const client = new WebClient(config.slack.botToken);

let bradescoIncidente: {
    inicio: number;
    nivel: ServiceStatus;
    alertaEnviado: boolean;
} | null = null;

/*-*-*-*-*-*-*-* INICIO BRADESCO *-*-*-*-*-*-*-*/
export async function tratarBradesco(services: any) {
    const dados = services.dados;
    const status = dados.status;
    const service = dados?.company

    /*-*-*-*-*-*-*-* WARNING *-*-*-*-*-*-*-*/
    if ((status === ServiceStatus.WARNING) && !bradescoIncidente) {
        bradescoIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} DETECTADO ! | INICIANDO CONTAGEM...`)
        return
    }

    if (status === ServiceStatus.WARNING && bradescoIncidente && !bradescoIncidente.alertaEnviado) {
        bradescoIncidente.nivel = ServiceStatus.WARNING

        const tempInterv: number = Date.now() - bradescoIncidente.inicio;
        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} NÃO COMPLETOU 1H !`)
            return
        }

        const emoji = ":warning:";
        const txt = "Instabilidade";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emoji} *${txt} - ${service}*\n\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(bradescoIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
        });

        bradescoIncidente.alertaEnviado = true;

        console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} ENVIADO NO SLACK !`);
        return;
    }


    /*-*-*-*-*-*-*-* WARNING *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.WARNING && bradescoIncidente?.nivel === ServiceStatus.DANGER) {
        console.log(`INSTABILIDADE EM ${service} FOI DE ${ServiceStatus.DANGER} PARA ${ServiceStatus.WARNING}, SEGUIMOS MONITORANDO !`)
        return
    }


    /*-*-*-*-*-*-*-* DANGER *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.DANGER && !bradescoIncidente) {
        bradescoIncidente = {
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
        bradescoIncidente.alertaEnviado = true;
        console.log(`STATUS ${ServiceStatus.WARNING} PARA ${service} ENVIADO NO SLACK !`);
        return;
    }


    /*-*-*-*-*-*-*-* WARNING -> DANGER *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.DANGER && bradescoIncidente && bradescoIncidente.nivel === ServiceStatus.WARNING) {
        bradescoIncidente.nivel = ServiceStatus.DANGER;

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
        });

        console.log(`STATUS ${ServiceStatus.DANGER} PARA ${service} ENVIADO NO SLACK !`);

        bradescoIncidente.alertaEnviado = true
        return;
    }


    /*-*-*-*-*-*-*-* WARNING || DANGER e volta para o SUCCESS *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.SUCCESS && bradescoIncidente && bradescoIncidente.nivel === ServiceStatus.WARNING && !bradescoIncidente.alertaEnviado) {
        bradescoIncidente.nivel = ServiceStatus.SUCCESS
        console.log(`${service} - OSCILAÇÃO DETECTADA, ZERANDO CONTAGEM !`)

        bradescoIncidente = null
    }

    /*-*-*-*-*-*-*-* PROBLEMA RESOLVIDO (volta pra success) *-*-*-*-*-*-*-*/
    if (status === ServiceStatus.SUCCESS && bradescoIncidente && bradescoIncidente.alertaEnviado) {
        const duracao = Date.now() - bradescoIncidente.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        } 

        const inicioIncidente = new Date(bradescoIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *Normalizado* - *${service}*\n\n• *Status:* \`resolved\`\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | Ver no Downdetector>`
        });

        console.log(`INCIDENTE NO ${service} RESOLVIDO ! DURAÇÃO: ${duracaoTexto}`);

        bradescoIncidente = null;
        return;
    }


    /*-*-*-*-*-*-*-* INCIDENTE JÁ ATIVO (não faz nada, só monitora) *-*-*-*-*-*-*-*/
    if ((status === ServiceStatus.WARNING || status === ServiceStatus.DANGER) && bradescoIncidente) {
        console.log(`INCIDENTE EM ${service} | STATUS: ${status} AINDA ATIVO...`);
        return;
    }

    /*-*-*-*-*-*-*-* TUDO OK *-*-*-*-*-*-*-*/
    console.log(`${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_paulo" })} | ${service} OK | Status: ${status}`);
}
/*-*-*-*-*-*-*-* FIM BRADESCO *-*-*-*-*-*-*-*/