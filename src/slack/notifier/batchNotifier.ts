import { WebClient } from "@slack/web-api";
import { config } from "../../config/env.js";
import { checkAllServices } from "../../pages/batchPages.js";

const client = new WebClient(config.slack.botToken);

let pixIncidente: {
    inicio: number;
    nivel: 'warning' | 'danger'
} | null = null;

let itauIncidente: {
    inicio: number;
    nivel: 'warning' | 'danger';
} | null = null;

let bradescoIncidente: {
    inicio: number;
    nivel: 'warning' | 'danger';
} | null = null;

let santanderIncidente: {
    inicio: number;
    nivel: 'warning' | 'danger';
} | null = null;

let NubankIncidente: {
    inicio: number;
    nivel: 'warning' | 'danger';
} | null = null;

// let AwsIncidente: {
//     inicio: number;
//     nivel: 'warning' | 'danger';
// } | null = null;

// let AzureIncidente: {
//     inicio: number;
//     nivel: 'warning' | 'danger';
// } | null = null;

// let ClearsaleIncidente: {
//     inicio: number;
//     nivel: 'warning' | 'danger';
// } | null = null;


let pixUltimoPico: string | null = null;
let itauUltimoPico: string | null = null;
let bradescoUltimoPico: string | null = null;
let santanderUltimoPico: string | null = null;
let NubankUltimoPico: string | null = null;
// let AwsUltimoPico: string | null = null;
// let AzureUltimoPico: string | null = null;
// let ClearsaleUltimoPico: string | null = null;







// '-' ============== INICIO PIX ============== '-' //
async function tratarPix(services: any) {
    const dados = services.dados;
    const status = dados.status;
    const reports = dados.series?.reports?.data || [];
    const service = dados?.company

    let maxReport = { x: "", y: 0 };
    for (let p of reports) {
        if (p.y > maxReport.y) {
            maxReport = p;
        }
    }
    console.log(`[DEBUG] ${service} - Total de reports: ${reports.length}`);
    console.log(`[DEBUG] ${service} - Max encontrado: ${maxReport.y} em ${maxReport.x}`);
    console.log(`[DEBUG] ${service} - Primeiro report:`, reports[0]);
    console.log(`[DEBUG] ${service} - Último report:`, reports[reports.length - 1]);


    const maxReportResult = maxReport.y;
    console.log("MAX", maxReportResult);
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";


    //  WARNING 
    // ============================================================
    if ((status === "warning" || status === "danger") && !pixIncidente) {
        pixIncidente = {
            inicio: Date.now(),
            nivel: status
        };

        const emoji = status === "danger" ? ":red_circle:" : ":warning:";
        const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emoji} *${txt} - ${service}*\n\n` +
                `Status: \`${status}\`\n\n` +
                `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
                `Pico de reclamações: ${maxReportResult} ( ${maxReportTimeStampResult} )\n\n` + //PAREI AQUI 
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(`Warning ou danger detectado em ${service}, status é ${status}`);
        return;
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && pixIncidente && pixIncidente.nivel === "warning") {
        pixIncidente.nivel = "danger";


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
                `Instabilidade com ${service} piorou para nível CRÍTICO\n\n` +
                `Pico de reclamações: ${maxReportResult} ( ${maxReportTimeStampResult} )\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });

        console.log("Problema agravou para DANGER no ", service);
        return;
    }




    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && pixIncidente) {
        const duracao = Date.now() - pixIncidente.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        } else {
            duracaoTexto = "menos de 1min";
        }

        const inicioIncidente = new Date(pixIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
                `Duração total: *${duracaoTexto}*\n\n` +
                `Início: ${inicioIncidente}\n\n` +
                `Fim: ${fimIncidente}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(` Incidente resolvido! Duração: ${duracaoTexto} no ${service}`);
        pixIncidente = null;
        return;
    }



    // INCIDENTE JÁ ATIVO (só monitora)
    // ============================================================
    if ((status === "warning" || status === "danger") && pixIncidente) {
        console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
        return;
    }



    //  PICO > 50 && sem incidente
    // ============================================================
    if (maxReportResult > 50 && !pixIncidente) {
        if (peakTimeStamp === pixUltimoPico) {
            console.log("já alertado, ignorando flasdfas...");
            return;
        }

        pixUltimoPico = peakTimeStamp;

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `Detectado alto volume de reclamações: ${service}\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `Horário do pico: ${maxReportTimeStampResult}\n\n` +
                `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
                `${services.url} | Monitorar no Downdetector>`
        });

        console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
        return;
    }

    // TUDO OK 
    // ============================================================
    console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
}
// '-' ============== FIM PIX ============== '-' //



























// '-' ============== INICIO ITAU ============== '-' //
async function tratarItau(services: any) {
    const dados = services.dados;
    const status = dados.status;
    const reports = dados.series?.reports?.data || [];
    const service = dados?.company

    let maxReport = { x: "", y: 0 };
    for (let p of reports) {
        if (p.y > maxReport.y) {
            maxReport = p;
        }
    }
    console.log(`[DEBUG] ${service} - Total de reports: ${reports.length}`);
    console.log(`[DEBUG] ${service} - Max encontrado: ${maxReport.y} em ${maxReport.x}`);
    console.log(`[DEBUG] ${service} - Primeiro report:`, reports[0]);
    console.log(`[DEBUG] ${service} - Último report:`, reports[reports.length - 1]);


    const maxReportResult = maxReport.y;
    console.log("MAX", maxReportResult);
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning" || status === "danger") && !itauIncidente) {
        itauIncidente = {
            inicio: Date.now(),
            nivel: status
        };

        const emoji = status === "danger" ? ":red_circle:" : ":warning:";
        const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emoji} *${txt} - ${service}*\n\n` +
                `Status: \`${status}\`\n\n` +
                `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
                `Pico de reclamações: ${maxReportResult} ( ${maxReportTimeStampResult} )\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(`Warning ou danger detectado em ${service}, status é ${status}`);

        return;
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && itauIncidente && itauIncidente.nivel === "warning") {
        itauIncidente.nivel = "danger";


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
                `Instabilidade com ${service} subiu para nível CRÍTICO\n\n` +
                `Pico de reclamações: ${maxReportResult} ( ${maxReportTimeStampResult} )\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log("Problema agravou para DANGER no ", service);
        return;
    }



    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && itauIncidente) {
        const duracao = Date.now() - itauIncidente.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        } else {
            duracaoTexto = "menos de 1min";
        }

        const inicioIncidente = new Date(itauIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
                `Duração total: *${duracaoTexto}*\n` +
                `Início: ${inicioIncidente}\n` +
                `Fim: ${fimIncidente}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(`Incidente resolvido! Duração: ${duracaoTexto} no ${service}`);
        itauIncidente = null;
        return;
    }



    // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
    // ============================================================
    if ((status === "warning" || status === "danger") && itauIncidente) {
        console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
        return;
    }




    // ALERTA DE PICO > 50 && sem incidente
    // ============================================================
    if (maxReportResult > 50 && !itauIncidente) {
        if (peakTimeStamp === itauUltimoPico) {
            console.log("já alertado, ignorando flasdfas...");
            return;
        }

        itauUltimoPico = peakTimeStamp;

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `Detectado alto volume de reclamações: ${service}\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `Horário do pico: ${maxReportTimeStampResult}\n\n` +
                `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
                `<${services.url} | Monitorar no Downdetector>`
        });

        console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
        return;
    }


    // TUDO OK 
    // ============================================================
    console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
}
// '-' ============== FIM ITAU ============== '-' //



























// '-' ============== INICIO BRADESCO ============== '-' //
async function tratarBradesco(services: any) {
    const dados = services.dados;
    const status = dados.status;
    const reports = dados.series?.reports?.data || [];
    const service = dados?.company

    let maxReport = { x: "", y: 0 };
    for (let p of reports) {
        if (p.y > maxReport.y) {
            maxReport = p;
        }
    }
    console.log(`[DEBUG] ${service} - Total de reports: ${reports.length}`);
    console.log(`[DEBUG] ${service} - Max encontrado: ${maxReport.y} em ${maxReport.x}`);
    console.log(`[DEBUG] ${service} - Primeiro report:`, reports[0]);
    console.log(`[DEBUG] ${service} - Último report:`, reports[reports.length - 1]);


    const maxReportResult = maxReport.y;

    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning" || status === "danger") && !bradescoIncidente) {
        bradescoIncidente = {
            inicio: Date.now(),
            nivel: status
        };

        const emoji = status === "danger" ? ":red_circle:" : ":warning:";
        const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emoji} *${txt} - ${service}*\n\n` +
                `Status: \`${status}\`\n\n` +
                `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
                `Pico de reclamações: ${maxReportResult} (${maxReportTimeStampResult})\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(`Warning ou danger detectado em ${service}, status é ${status}`);
        return;
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && bradescoIncidente && bradescoIncidente.nivel === "warning") {
        bradescoIncidente.nivel = "danger";


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
                `Instabilidade com ${service} piorou para nível CRÍTICO\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });

        console.log("Problema agravou para DANGER no ", service);
        return;
    }




    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && bradescoIncidente) {
        const duracao = Date.now() - bradescoIncidente.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        } else {
            duracaoTexto = "menos de 1min";
        }

        const inicioIncidente = new Date(bradescoIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
                `Duração total: *${duracaoTexto}*\n` +
                `Início: ${inicioIncidente}\n` +
                `Fim: ${fimIncidente}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(` Incidente resolvido! Duração: ${duracaoTexto}`);
        bradescoIncidente = null;
        return;
    }



    // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
    // ============================================================
    if ((status === "warning" || status === "danger") && bradescoIncidente) {
        console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
        return;
    }




    // ALERTA DE PICO > 50 && sem incidente
    // ============================================================
    if (maxReportResult > 50 && !bradescoIncidente) {
        if (peakTimeStamp === bradescoUltimoPico) {
            console.log("já alertado, ignorando flasdfas...");
            return;
        }

        bradescoUltimoPico = peakTimeStamp;

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `Detectado alto volume de reclamações: ${service}\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `Horário do pico: ${maxReportTimeStampResult}\n\n` +
                `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
                `<${services.url} | Monitorar no Downdetector>`
        });

        console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
        return;
    }


    // TUDO OK 
    // ============================================================
    console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
}
// '-' ============== FIM BRADESCO ============== '-' //



























// '-' ============== INICIO SANTANDER ============== '-' //
async function tratarSantander(services: any) {
    const dados = services.dados;
    const status = dados.status;
    const reports = dados.series?.reports?.data || [];
    const service = dados?.company

    let maxReport = { x: "", y: 0 };
    for (let p of reports) {
        if (p.y > maxReport.y) {
            maxReport = p;
        }
    }
    console.log(`[DEBUG] ${service} - Total de reports: ${reports.length}`);
    console.log(`[DEBUG] ${service} - Max encontrado: ${maxReport.y} em ${maxReport.x}`);
    console.log(`[DEBUG] ${service} - Primeiro report:`, reports[0]);
    console.log(`[DEBUG] ${service} - Último report:`, reports[reports.length - 1]);




    const maxReportResult = maxReport.y;
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning" || status === "danger") && !santanderIncidente) {
        santanderIncidente = {
            inicio: Date.now(),
            nivel: status
        };

        const emoji = status === "danger" ? ":red_circle:" : ":warning:";
        const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emoji} *${txt} - ${service}*\n\n` +
                `Status: \`${status}\`\n\n` +
                `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
                `Pico de reclamações: ${maxReportResult} ( ${maxReportTimeStampResult} )\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(`Warning ou danger detectado em ${service}, status é ${status}`);
        return;
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && santanderIncidente && santanderIncidente.nivel === "warning") {
        santanderIncidente.nivel = "danger";


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
                `Instabilidade com ${service} piorou para nível CRÍTICO\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });

        console.log("Problema agravou para DANGER no ", service);
        return;
    }




    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && santanderIncidente) {
        const duracao = Date.now() - santanderIncidente.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        } else {
            duracaoTexto = "menos de 1min";
        }

        const inicioIncidente = new Date(santanderIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
                `Duração total: *${duracaoTexto}*\n` +
                `Início: ${inicioIncidente}\n` +
                `Fim: ${fimIncidente}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(` Incidente resolvido! Duração: ${duracaoTexto}`);
        santanderIncidente = null;
        return;
    }


    // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
    // ============================================================
    if ((status === "warning" || status === "danger") && santanderIncidente) {
        console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
        return;
    }




    // ALERTA DE PICO > 50 && sem incidente
    // ============================================================
    if (maxReportResult > 50 && !santanderIncidente) {
        if (peakTimeStamp === santanderUltimoPico) {
            console.log("já alertado, ignorando flasdfas...");
            return;
        }

        santanderUltimoPico = peakTimeStamp;

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `Detectado alto volume de reclamações: ${service}\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `Horário do pico: ${maxReportTimeStampResult}\n\n` +
                `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
                `<${services.url} | Monitorar no Downdetector>`
        });

        console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
        return;
    }


    // TUDO OK 
    // ============================================================
    console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
}

// '-' ============== FIM SANTANDER ============== '-' //



























// '-' ============== INICIO NUBANK ============== '-' //
async function tratarNubank(services: any) {
    const dados = services.dados;
    const status = dados.status;
    const reports = dados.series?.reports?.data || [];
    const service = dados?.company

    let maxReport = { x: "", y: 0 };
    for (let p of reports) {
        if (p.y > maxReport.y) {
            maxReport = p;
        }
    }
    console.log(`[DEBUG] ${service} - Total de reports: ${reports.length}`);
    console.log(`[DEBUG] ${service} - Max encontrado: ${maxReport.y} em ${maxReport.x}`);
    console.log(`[DEBUG] ${service} - Primeiro report:`, reports[0]);
    console.log(`[DEBUG] ${service} - Último report:`, reports[reports.length - 1]);




    const maxReportResult = maxReport.y;
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning" || status === "danger") && !NubankIncidente) {
        NubankIncidente = {
            inicio: Date.now(),
            nivel: status
        };

        const emoji = status === "danger" ? ":red_circle:" : ":warning:";
        const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emoji} *${txt} - ${service}*\n\n` +
                `Status: \`${status}\`\n\n` +
                `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
                `Pico de reclamações: ${maxReportResult} ( ${maxReportTimeStampResult} )\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(`Warning ou danger detectado em ${service}, status é ${status}`);
        return;
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && NubankIncidente && NubankIncidente.nivel === "warning") {
        NubankIncidente.nivel = "danger";


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
                `Instabilidade com ${service} piorou para nível CRÍTICO\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });

        console.log("Problema agravou para DANGER no ", service);
        return;
    }



 
    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && NubankIncidente) {
        const duracao = Date.now() - NubankIncidente.inicio;
        const minutos = Math.floor(duracao / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;

        let duracaoTexto = "";
        if (horas > 0) {
            duracaoTexto = `${horas}h ${minutosRestantes}min`;
        } else if (minutos > 0) {
            duracaoTexto = `${minutos}min`;
        } else {
            duracaoTexto = "menos de 1min";
        }

        const inicioIncidente = new Date(NubankIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
                `Duração total: *${duracaoTexto}*\n` +
                `Início: ${inicioIncidente}\n` +
                `Fim: ${fimIncidente}\n\n` +
                `<${services.url} | Ver detalhes no Downdetector>`
        });


        console.log(` Incidente resolvido! Duração: ${duracaoTexto}`);
        NubankIncidente = null;
        return;
    }


    // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
    // ============================================================
    if ((status === "warning" || status === "danger") && NubankIncidente) {
        console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
        return;
    }




    // ALERTA DE PICO > 50 && sem incidente
    // ============================================================
    if (maxReportResult > 50 && !NubankIncidente) {
        if (peakTimeStamp === NubankUltimoPico) {
            console.log("já alertado, ignorando flasdfas...");
            return;
        }

        NubankUltimoPico = peakTimeStamp;

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `Detectado alto volume de reclamações: ${service}\n\n` +
                `Reclamações: ${maxReportResult}\n\n` +
                `Horário do pico: ${maxReportTimeStampResult}\n\n` +
                `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
                `<${services.url} | Monitorar no Downdetector>`
        });

        console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
        return;
    }


    // TUDO OK 
    // ============================================================
    console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
}
// '-' ============== FIM NUBANK ============== '-' //





















// // '-' ============== INICIO AWS ============== '-' //
// async function tratarAws(services: any) {
//     const dados = services.dados;
//     const status = dados.status;
//     const reports = dados.series?.reports?.data || [];
//     const service = dados?.company

//     let maxReport = { x: "", y: 0 };
//     for (let p of reports) {
//         if (p.y > maxReport.y) {
//             maxReport = p;
//         }
//     }
//     //console.log("MAX" , maxReport);

//     const maxReportResult = maxReport.y;
//     const peakTimeStamp = maxReport.x;
//     const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



//     //  WARNING
//     // ============================================================
//     if ((status === "warning" || status === "danger") && !AwsIncidente) {
//         AwsIncidente = {
//             inicio: Date.now(),
//             nivel: status
//         };

//         const emoji = status === "danger" ? ":red_circle:" : ":warning:";
//         const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `${emoji} *${txt} - ${service}*\n\n` +
//                 `Status: \`${status}\`\n\n` +
//                 `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
//                 `Reclamações: ${maxReportResult}\n\n` +
//                 `<${services.url} | Ver detalhes no Downdetector>`
//         });


//         console.log("Warning detectado!");
//         console.log(status)
//         return;
//     }

//     // PROBLEMA PIOROU warning -> danger
//     // ============================================================

//     if (status === "danger" && AwsIncidente && AwsIncidente.nivel === "warning") {
//         AwsIncidente.nivel = "danger";


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
//                 `Instabilidade com ${service} piorou para nível CRÍTICO\n\n` +
//                 `Reclamações: ${maxReportResult}\n\n` +
//                 `<${services.url} | Ver detalhes no Downdetector>`
//         });

//         console.log("Problema agravou para DANGER!");
//         return;
//     }



//     // ============================================================
//     // PROBLEMA RESOLVIDO (volta pra success)
//     // ============================================================
//     if (status === "success" && AwsIncidente) {
//         const duracao = Date.now() - AwsIncidente.inicio;
//         const minutos = Math.floor(duracao / 60000);
//         const horas = Math.floor(minutos / 60);
//         const minutosRestantes = minutos % 60;

//         let duracaoTexto = "";
//         if (horas > 0) {
//             duracaoTexto = `${horas}h ${minutosRestantes}min`;
//         } else if (minutos > 0) {
//             duracaoTexto = `${minutos}min`;
//         } else {
//             duracaoTexto = "menos de 1min";
//         }

//         const inicioIncidente = new Date(AwsIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
//         const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
//                 `Duração total: *${duracaoTexto}*\n` +
//                 `Início: ${inicioIncidente}\n` +
//                 `Fim: ${fimIncidente}\n\n` +
//                 `<${services.url} | Ver detalhes no Downdetector>`
//         });


//         console.log(` Incidente resolvido! Duração: ${duracaoTexto}`);
//         AwsIncidente = null;
//         return;
//     }



//     // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
//     // ============================================================
//     if ((status === "warning" || status === "danger") && AwsIncidente) {
//         console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
//         return;
//     }




//     // ALERTA DE PICO > 50 && sem incidente
//     // ============================================================
//     if (maxReportResult > 50 && !AwsIncidente) {
//         if (peakTimeStamp === AwsUltimoPico) {
//             console.log("já alertado, ignorando flasdfas...");
//             return;
//         }

//         AwsUltimoPico = peakTimeStamp;

//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `Detectado alto volume de reclamações: ${service}\n\n` +
//                 `Reclamações: ${maxReportResult}\n\n` +
//                 `Horário do pico: ${maxReportTimeStampResult}\n\n` +
//                 `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
//                 `<${services.url} | Monitorar no Downdetector>`
//         });

//         console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
//         return;
//     }


//     // TUDO OK 
//     // ============================================================
//     console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
// }
// // '-' ============== FIM NUBANK ============== '-' //


























// // '-' ============== INICIO AZURE ============== '-' //
// async function tratarAzure(services: any) {
//     const dados = services.dados;
//     const status = dados.status;
//     const reports = dados.series?.reports?.data || [];
//     const service = dados?.company

//     let maxReport = { x: "", y: 0 };
//     for (let p of reports) {
//         if (p.y > maxReport.y) {
//             maxReport = p;
//         }
//     }
//     //console.log("MAX" , maxReport);

//     const maxReportResult = maxReport.y;
//     const peakTimeStamp = maxReport.x;
//     const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";


//     //  WARNING
//     // ============================================================
//     if ((status === "warning" || status === "danger") && !AzureIncidente) {
//         AzureIncidente = {
//             inicio: Date.now(),
//             nivel: status
//         };

//         const emoji = status === "danger" ? ":red_circle:" : ":warning:";
//         const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `${emoji} *${txt} - ${service}*\n\n` +
//                 `Status: \`${status}\`\n\n` +
//                 `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
//                 `Reclamações: ${maxReportResult}\n\n` +
//                 `<${services.url} | Ver detalhes no Downdetector>`
//         });


//         console.log("Warning detectado!");
//         console.log(status)
//         return;
//     }


//     // PROBLEMA PIOROU warning -> danger
//     // ============================================================

//     if (status === "danger" && AzureIncidente && AzureIncidente.nivel === "warning") {
//         AzureIncidente.nivel = "danger";


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
//                 `Instabilidade com ${service} piorou para nível CRÍTICO\n\n` +
//                 `Reclamações: ${maxReportResult}\n\n` +
//                 `<${services.url} | Ver detalhes no Downdetector>`
//         });

//         console.log("Problema agravou para DANGER!");
//         return;
//     }



//     // ============================================================
//     // PROBLEMA RESOLVIDO (volta pra success)
//     // ============================================================
//     if (status === "success" && AzureIncidente) {
//         const duracao = Date.now() - AzureIncidente.inicio;
//         const minutos = Math.floor(duracao / 60000);
//         const horas = Math.floor(minutos / 60);
//         const minutosRestantes = minutos % 60;

//         let duracaoTexto = "";
//         if (horas > 0) {
//             duracaoTexto = `${horas}h ${minutosRestantes}min`;
//         } else if (minutos > 0) {
//             duracaoTexto = `${minutos}min`;
//         } else {
//             duracaoTexto = "menos de 1min";
//         }

//         const inicioIncidente = new Date(AzureIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
//         const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
//                 `Duração total: *${duracaoTexto}*\n` +
//                 `Início: ${inicioIncidente}\n` +
//                 `Fim: ${fimIncidente}\n\n` +
//                 `<${services.url} | Ver detalhes no Downdetector>`
//         });


//         console.log(` Incidente resolvido! Duração: ${duracaoTexto}`);
//         AzureIncidente = null;
//         return;
//     }



//     // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
//     // ============================================================
//     if ((status === "warning" || status === "danger") && AzureIncidente) {
//         console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
//         return;
//     }



//     // ALERTA DE PICO > 50 && sem incidente
//     // ============================================================
//     if (maxReportResult > 50 && !AzureIncidente) {
//         if (peakTimeStamp === AzureUltimoPico) {
//             console.log("já alertado, ignorando flasdfas...");
//             return;
//         }

//         AzureUltimoPico = peakTimeStamp;

//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `Detectado alto volume de reclamações: ${service}\n\n` +
//                 `Reclamações: ${maxReportResult}\n\n` +
//                 `Horário do pico: ${maxReportTimeStampResult}\n\n` +
//                 `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
//                 `<${services.url} | Monitorar no Downdetector>`
//         });

//         console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
//         return;
//     }


//     // TUDO OK 
//     // ============================================================
//     console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
// }
// // '-' ============== FIM AZURE ============== '-' //


























//INSPECIONAR O SITE E IMPLEMENTAR AQUI
// '-' ============== INICIO CLEARSALE ============== '-' //

// async function tratarClearsale(banco: any) {
//     const dados = banco.dados;
//     const status = dados.status;
//     const reports = dados.series?.reports?.data || [];
//     const service = dados?.company

//     let maxReport = { x: "", y: 0 };
//     for (let p of reports) {
//         if (p.y > maxReport.y) {
//             maxReport = p;
//         }
//     }
//     //console.log("MAX" , maxReport);

//     const maxReportt = maxReport.y;
//     const picoTimestamp = maxReport.x;
//     const horarioPico = picoTimestamp ? new Date(picoTimestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";

//       // ============================================================
//      //  WARNING
//     // ============================================================
//     if ((status === "warning" || status === "danger") && !itauIncidente) {
//         itauIncidente = {
//             inicio: Date.now(),
//             nivel: status
//         };

//         const emoji = status === "danger" ? ":red_circle:" : ":warning:";
//         const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `${emoji} *${txt} - ${service}*\n\n` +
//                 `Status: \`${status}\`\n\n` +
//                 `Detectado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
//                 `Reclamações: ${maxReportt}\n\n` +
//                 `<${banco.url} | Ver detalhes no Downdetector>`
//         });


//         console.log("Warning detectado!");
//         console.log(status)
//         return;
//     }

//  // ============================================================
//     // PROBLEMA PIOROU warning -> danger
//     // ============================================================

//     if (status === "danger" && itauIncidente && itauIncidente.nivel === "warning") {
//         itauIncidente.nivel = "danger";


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `:red_circle: *SITUAÇÃO AGRAVOU!*\n\n` +
//                 `Instabilidade com ${service} piorou para nível CRÍTICO\n\n` +
//                 `Reclamações: ${maxReportt}\n\n` +
//                 `<${banco.url} | Ver detalhes no Downdetector>`
//         });

//         console.log("Problema agravou para DANGER!");
//         return;
//     }



//  // ============================================================
//     // PROBLEMA RESOLVIDO (volta pra success)
//     // ============================================================
//     if (status === "success" && itauIncidente) {
//         const duracao = Date.now() - itauIncidente.inicio;
//         const minutos = Math.floor(duracao / 60000);
//         const horas = Math.floor(minutos / 60);
//         const minutosRestantes = minutos % 60;

//         let duracaoTexto = "";
//         if (horas > 0) {
//             duracaoTexto = `${horas}h ${minutosRestantes}min`;
//         } else if (minutos > 0) {
//             duracaoTexto = `${minutos}min`;
//         } else {
//             duracaoTexto = "menos de 1min";
//         }

//         const inicioIncidente = new Date(itauIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
//         const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `:white_check_mark: *NORMALIZADO* - ${service}\n\n` +
//                 `Duração total: *${duracaoTexto}*\n` +
//                 `Início: ${inicioIncidente}\n` +
//                 `Fim: ${fimIncidente}\n\n` +
//                 `<${banco.url} | Ver detalhes no Downdetector>`
//         });


//         console.log(` Incidente resolvido! Duração: ${duracaoTexto}`);
//         itauIncidente = null;
//         return;
//     }



//     // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
//     // ============================================================
//     if ((status === "warning" || status === "danger") && itauIncidente) {
//         console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
//         return;
//     }




//     // ALERTA DE PICO > 50 && sem incidente
//     // ============================================================
//     if (maxReportt > 50 && !itauIncidente) {
//         if (picoTimestamp === ClearsaleUltimoPico) {
//             console.log("já alertado, ignorando flasdfas...");
//             return;
//         }

//         ClearsaleUltimoPico = picoTimestamp;

//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text:`Detectado alto volume de reclamações: ${service}\n\n` +
//                 `Reclamações: ${maxReportt}\n\n` +
//                 `Horário do pico: ${horarioPico}\n\n` +
//                 `Status oficial: \`${status}\` (Nenhuma Instabilidade confirmada)\n\n` +
//                 `<${banco.url} | Monitorar no Downdetector>`
//         });

//         console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportt}`);
//         return;
//     }


//     // TUDO OK 
//     // ============================================================
//     console.log(`${service} OK | Status: ${status} | Pico: ${maxReportt}`);
// }
// '-' ============== FIM CLEARSALE ============== '-' //



























export async function CheckAll() {
    console.log("iniciando a verificação dos services");


    const allData = await checkAllServices();

    if (!allData) return;


    for (const banco of allData) {
        if (banco.nome === 'Pix') {
            await tratarPix(banco);
        }
        else if (banco.nome === 'Itaú') {
            await tratarItau(banco);
        }
        else if (banco.nome === 'Bradesco') {
            await tratarBradesco(banco);
        }
        else if (banco.nome === 'Santander') {
            await tratarSantander(banco);
        }
        else if (banco.nome === 'Nubank') {
            await tratarNubank(banco);
        }
        // else if (banco.nome === 'AWS') {
        //     await tratarAws(banco);
        // }
        // else if (banco.nome === 'Azure') {
        //     await tratarAzure(banco);
        // }
        // else if (banco.nome === 'Clearsale') {
        //     await tratarClearsale(banco);
        // }


    }

    console.log("é isso...");
}