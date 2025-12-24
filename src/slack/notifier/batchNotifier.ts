import { WebClient } from "@slack/web-api";
import { config } from "../../config/env.js";
import { checkAllServices } from "../../pages/batchPages.js";

const client = new WebClient(config.slack.botToken);

let pixIncidente: {
    inicio: number;
    nivel: 'success' | 'warning' | 'danger',
    alertaEnviado: boolean
} | null = null;

let itauIncidente: {
    inicio: number;
    nivel: 'success' | 'warning' | 'danger',
    alertaEnviado: boolean;
} | null = null;

let bradescoIncidente: {
    inicio: number;
    nivel: 'success' | 'warning' | 'danger',
    alertaEnviado: boolean;
} | null = null;

let santanderIncidente: {
    inicio: number;
    nivel: 'success' | 'warning' | 'danger',
    alertaEnviado: boolean;
} | null = null;

let NubankIncidente: {
    inicio: number;
    nivel: 'success' | 'warning' | 'danger',
    alertaEnviado: boolean;
} | null = null;

let BBIncidente: {
    inicio: number;
    nivel: 'success' | 'warning' | 'danger',
    alertaEnviado: boolean;
} | null = null;

// let CloudflareIncidente: {
//     inicio: number;
//     nivel: 'warning' | 'danger';
// } | null = null;

// let ClearsaleIncidente: {
//     inicio: number;
//     nivel: 'warning' | 'danger';
// } | null = null;


// let pixUltimoPico: string | null = null;
// let itauUltimoPico: string | null = null;
// let bradescoUltimoPico: string | null = null;
// let santanderUltimoPico: string | null = null;
// let NubankUltimoPico: string | null = null;
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

    const maxReportResult = dados.max
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //tentando mandar a mensagem depois de 1 hora caso ainda tenha o warning...
    //  WARNING 
    // ============================================================
    if ((status === "warning") && !pixIncidente) {
        pixIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`primeiro status warning detectado para ${service}, iniciando contagem...`)
        return
    }

    if (status === "warning" && pixIncidente && !pixIncidente.alertaEnviado) {
        pixIncidente.nivel = "warning"

        const tempInterv: number = Date.now() - pixIncidente.inicio;

        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log("status warning ainda nao completou 1h")
            return
        }

        if (tempInterv >= uma_hora) {
            const emoji = ":warning:";
            const txt = "Instabilidade";

            await client.chat.postMessage({
                channel: config.slack.channel,
                text: `${emoji} *${txt} - ${service}*\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(pixIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
            });

            pixIncidente.alertaEnviado = true;

            console.log(`Warning enviado no slack, detectado em ${service}, status é ${status}`);
            return;

        }
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && pixIncidente && pixIncidente.nivel === "warning") {
        pixIncidente.nivel = "danger";

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
        });

        console.log(`msg enviado no slack, Problema agravou para DANGER no ${service}`);
        return;
    }


    //elaborar o reset quando o status estava warning ou danger e volta para o success, 
    // nao estou considerando as oscilações no momento de mandar notificação

    if (status === "success" && pixIncidente && pixIncidente.nivel === "warning" && !pixIncidente.alertaEnviado) {
        pixIncidente.nivel = "success"
        console.log(`${service} Oscilacao detectada, zerando contagem `)

        pixIncidente = null
    }

    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && pixIncidente && pixIncidente.alertaEnviado) {
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
            duracaoTexto = "menos de 1min"; //duvido
        }

        const inicioIncidente = new Date(pixIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *Normalizado* - *${service}*\n• *Status: \`resolved\`*\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | *Ver no Downdetector*>`
        });


        console.log(` Incidente no ${service}resolvido! Duração: ${duracaoTexto}`);
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
    // if (maxReportResult > 50 && !pixIncidente && status === "success") {
    //     if (peakTimeStamp === pixUltimoPico) {
    //         console.log("já alertado, ignorando flasdfas...");
    //         return;
    //     }

    //     if (peakTimeStamp) {
    //         const peakTime = new Date(peakTimeStamp).getTime(); // sttring para número
    //         const now = Date.now();
    //         const minutosAtras = (now - peakTime) / (1000 * 60); // ms para minutos

    //         if (minutosAtras > 60) {
    //             console.log(`${service}: Pico de ${Math.floor(minutosAtras)}min atrás - ignorando`);
    //             return; // nem adianta continuar, pra pegar o pico atrasado, nem compensa
    //         }
    //     }

    //     pixUltimoPico = peakTimeStamp;

    //     await client.chat.postMessage({
    //         channel: config.slack.channel,
    //         text: `Detectado alto volume de reclamações: ${service}\n\n` +
    //             `Reclamações: ${maxReportResult}\n\n` +
    //             `Horário do pico: ${maxReportTimeStampResult}\n\n` +
    //             `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
    //             `<${services.url} | Monitorar no Downdetector>`
    //     });

    //     console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
    //     return;
    // }

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

    const maxReportResult = dados.max
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";


    //  WARNING
    // ============================================================
    if ((status === "warning") && !itauIncidente) {
        itauIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`primeiro status warning detectado para ${service}, iniciando contagem...`)
        return
    }

    if (status === "warning" && itauIncidente && !itauIncidente.alertaEnviado) {
        itauIncidente.nivel = "warning"

        const tempInterv: number = Date.now() - itauIncidente.inicio;

        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log("status warning ainda nao completou 1h")
            return
        }

        if (tempInterv >= uma_hora) {
            const emoji = ":warning:";
            const txt = "Instabilidade";

            await client.chat.postMessage({
                channel: config.slack.channel,
                text: `${emoji} *${txt} - ${service}*\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(itauIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
            });
            itauIncidente.alertaEnviado = true;
            console.log(`Warning enviado no slack, detectado em ${service}, status é ${status}`);
            return;

        }
    }



    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && itauIncidente && itauIncidente.nivel === "warning") {
        itauIncidente.nivel = "danger";

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
        });


        console.log(`msg enviado no slack, Problema agravou para DANGER no ${service}`);
        return;
    }


    //elaborar o reset quando o status estava warning ou danger e volta para o success, 
    // nao estou considerando as oscilações no momento de mandar notificação

    if (status === "success" && itauIncidente && itauIncidente.nivel === "warning" && !itauIncidente.alertaEnviado) {
        itauIncidente.nivel = "success"
        console.log(`${service} Oscilacao detectada, zerando contagem `)

        itauIncidente = null
    }



    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && itauIncidente && itauIncidente.alertaEnviado) {
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
            duracaoTexto = "menos de 1min"; //jamais
        }

        const inicioIncidente = new Date(itauIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *Normalizado* - *${service}*\n• *Status: \`resolved\`*\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | *Ver no Downdetector*>`
        });


        console.log(` Incidente no ${service}resolvido! Duração: ${duracaoTexto}`);
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
    // if (maxReportResult > 50 && !itauIncidente && status === "success") {
    //     if (peakTimeStamp === itauUltimoPico) {
    //         console.log("já alertado, ignorando flasdfas...");
    //         return;
    //     }

    //     if (peakTimeStamp) {
    //         const peakTime = new Date(peakTimeStamp).getTime(); // sttring para número
    //         const now = Date.now();
    //         const minutosAtras = (now - peakTime) / (1000 * 60); // ms para minutos

    //         if (minutosAtras > 60) {
    //             console.log(`${service}: Pico de ${Math.floor(minutosAtras)}min atrás - ignorando`);
    //             return; // nem adianta continuar, pra pegar o pico atrasado, nem compensa
    //         }
    //     }


    //     itauUltimoPico = peakTimeStamp;

    //     await client.chat.postMessage({
    //         channel: config.slack.channel,
    //         text: `Detectado alto volume de reclamações: ${service}\n\n` +
    //             `Reclamações: ${maxReportResult}\n\n` +
    //             `Horário do pico: ${maxReportTimeStampResult}\n\n` +
    //             `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
    //             `<${services.url} | Monitorar no Downdetector>`
    //     });

    //     console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
    //     return;
    //}


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

    const maxReportResult = dados.max
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning") && !bradescoIncidente) {
        bradescoIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`primeiro status warning detectado para ${service}, iniciando contagem...`)
        return
    }

    if (status === "warning" && bradescoIncidente && !bradescoIncidente.alertaEnviado) {
        bradescoIncidente.nivel = "warning"

        const tempInterv: number = Date.now() - bradescoIncidente.inicio;

        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log("status warning ainda nao completou 1h")
            return
        }

        if (tempInterv >= uma_hora) {
            const emoji = ":warning:";
            const txt = "Instabilidade";

            await client.chat.postMessage({
                channel: config.slack.channel,
                text: `${emoji} *${txt} - ${service}*\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(bradescoIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
            });
            bradescoIncidente.alertaEnviado = true;
            console.log(`Warning enviado no slack, detectado em ${service}, status é ${status}`);
            return;

        }
    }

    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && bradescoIncidente && bradescoIncidente.nivel === "warning") {
        bradescoIncidente.nivel = "danger";

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
        });

        console.log(`msg enviado no slack, Problema agravou para DANGER no ${service}`);
        return;
    }

    //elaborar o reset quando o status estava warning ou danger e volta para o success, 
    // nao estou considerando as oscilações no momento de mandar notificação

    if (status === "success" && bradescoIncidente && bradescoIncidente.nivel === "warning" && !bradescoIncidente.alertaEnviado) {
        bradescoIncidente.nivel = "success"
        console.log(`${service} Oscilacao detectada, zerando contagem `)

        bradescoIncidente = null
    }



    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && bradescoIncidente && bradescoIncidente.alertaEnviado) {
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
            text: `:white_check_mark: *Normalizado* - *${service}*\n• *Status: \`resolved\`*\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | *Ver no Downdetector*>`
        });


        console.log(` Incidente no ${service}resolvido! Duração: ${duracaoTexto}`);
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
    // if (maxReportResult > 50 && !bradescoIncidente && status === "success") {
    //     if (peakTimeStamp === bradescoUltimoPico) {
    //         console.log("já alertado, ignorando flasdfas...");
    //         return;
    //     }

    //     if (peakTimeStamp) {
    //         const peakTime = new Date(peakTimeStamp).getTime(); // sttring para número
    //         const now = Date.now();
    //         const minutosAtras = (now - peakTime) / (1000 * 60); // ms para minutos

    //         if (minutosAtras > 60) {
    //             console.log(`${service}: Pico de ${Math.floor(minutosAtras)}min atrás - ignorando`);
    //             return; // nem adianta continuar, pra pegar o pico atrasado, nem compensa
    //         }
    //     }


    //     bradescoUltimoPico = peakTimeStamp;

    //     await client.chat.postMessage({
    //         channel: config.slack.channel,
    //         text: `Detectado alto volume de reclamações: ${service}\n\n` +
    //             `Reclamações: ${maxReportResult}\n\n` +
    //             `Horário do pico: ${maxReportTimeStampResult}\n\n` +
    //             `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
    //             `<${services.url} | Monitorar no Downdetector>`
    //     });

    //     console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
    //     return;
    // }


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


    const maxReportResult = dados.max;
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning") && !santanderIncidente) {
        santanderIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`primeiro status warning detectado para ${service}, iniciando contagem...`)
        return
    }

    if (status === "warning" && santanderIncidente && !santanderIncidente.alertaEnviado) {
        santanderIncidente.nivel = "warning"

        const tempInterv: number = Date.now() - santanderIncidente.inicio;

        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log("status warning ainda nao completou 1h")
            return
        }

        if (tempInterv >= uma_hora) {
            const emoji = ":warning:";
            const txt = "Instabilidade";

            await client.chat.postMessage({
                channel: config.slack.channel,
                text: `${emoji} *${txt} - ${service}*\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(santanderIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
            });

            santanderIncidente.alertaEnviado = true;

            console.log(`Warning enviado no slack, detectado em ${service}, status é ${status}`);
            return;

        }
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && santanderIncidente && santanderIncidente.nivel === "warning") {
        santanderIncidente.nivel = "danger";

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
        });

        console.log(`msg nviado no slack, Problema agravou para DANGER no ${service}`);
        return;
    }

    //elaborar o reset quando o status estava warning ou danger e volta para o success, 
    // nao estou considerando as oscilações no momento de mandar notificação

    if (status === "success" && santanderIncidente && santanderIncidente.nivel === "warning" && !santanderIncidente.alertaEnviado) {
        santanderIncidente.nivel = "success"
        console.log(`${service} Oscilacao detectada, zerando contagem `)

        santanderIncidente = null
    }



    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && santanderIncidente && santanderIncidente.alertaEnviado) {
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
            text: `:white_check_mark: *Normalizado* - *${service}*\n• *Status: \`resolved\`*\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | *Ver no Downdetector*>`
        });


        console.log(` Incidente no ${service}resolvido! Duração: ${duracaoTexto}`);
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
    // if (maxReportResult > 50 && !santanderIncidente && status === "success") {
    //     if (peakTimeStamp === santanderUltimoPico) {
    //         console.log("já alertado, ignorando flasdfas...");
    //         return;
    //     }

    //     if (peakTimeStamp) {
    //         const peakTime = new Date(peakTimeStamp).getTime(); // sttring para número
    //         const now = Date.now();
    //         const minutosAtras = (now - peakTime) / (1000 * 60); // ms para minutos

    //         if (minutosAtras > 60) {
    //             console.log(`${service}: Pico de ${Math.floor(minutosAtras)}min atrás - ignorando`);
    //             return; // nem adianta continuar, pra pegar o pico atrasado, nem compensa
    //         }
    //     }

    //     santanderUltimoPico = peakTimeStamp;

    //     await client.chat.postMessage({
    //         channel: config.slack.channel,
    //         text: `Detectado alto volume de reclamações: ${service}\n\n` +
    //             `Reclamações: ${maxReportResult}\n\n` +
    //             `Horário do pico: ${maxReportTimeStampResult}\n\n` +
    //             `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
    //             `<${services.url} | Monitorar no Downdetector>`
    //     });

    //     console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
    //     return;
    // }


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




    const maxReportResult = dados.max
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning") && !NubankIncidente) {
        NubankIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`primeiro status warning detectado para ${service}, iniciando contagem...`)
        return
    }

    if (status === "warning" && NubankIncidente && !NubankIncidente.alertaEnviado) {
        NubankIncidente.nivel = "warning"

        const tempInterv: number = Date.now() - NubankIncidente.inicio;

        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log("status warning ainda nao completou 1h")
            return
        }

        if (tempInterv >= uma_hora) {
            const emoji = ":warning:";
            const txt = "Instabilidade";

            await client.chat.postMessage({
                channel: config.slack.channel,
                text: `${emoji} *${txt} - ${service}*\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(NubankIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
            });
            NubankIncidente.alertaEnviado = true;
            console.log(`Warning enviado no slack, detectado em ${service}, status é ${status}`);
            return;

        }
    }


    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && NubankIncidente && NubankIncidente.nivel === "warning") {
        NubankIncidente.nivel = "danger";

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
        });

        console.log(`msg enviado no slack, Problema agravou para DANGER no ${service}`);
        return;
    }

    //elaborar o reset quando o status estava warning ou danger e volta para o success, 
    // nao estou considerando as oscilações no momento de mandar notificação

    if (status === "success" && NubankIncidente && NubankIncidente.nivel === "warning" && !NubankIncidente.alertaEnviado) {
        NubankIncidente.nivel = "success"
        console.log(`${service} Oscilacao detectada, zerando contagem `)

        NubankIncidente = null
    }



    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && NubankIncidente && NubankIncidente.alertaEnviado) {
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
            text: `:white_check_mark: *Normalizado* - *${service}*\n• *Status: \`resolved\`*\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | *Ver no Downdetector*>`
        });


        console.log(` Incidente no ${service}resolvido! Duração: ${duracaoTexto}`);
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
    // if (maxReportResult > 50 && !NubankIncidente && status === "success") {
    //     if (peakTimeStamp === NubankUltimoPico) {
    //         console.log("já alertado, ignorando flasdfas...");
    //         return;
    //     }

    //     if (peakTimeStamp) {
    //         const peakTime = new Date(peakTimeStamp).getTime(); // sttring para número
    //         const now = Date.now();
    //         const minutosAtras = (now - peakTime) / (1000 * 60); // ms para minutos

    //         if (minutosAtras > 60) {
    //             console.log(`${service}: Pico de ${Math.floor(minutosAtras)}min atrás - ignorando`);
    //             return; // nem adianta continuar, pra pegar o pico atrasado, nem compensa
    //         }
    //     }

    //     NubankUltimoPico = peakTimeStamp;

    //     await client.chat.postMessage({
    //         channel: config.slack.channel,
    //         text: `Detectado alto volume de reclamações: ${service}\n\n` +
    //             `Reclamações: ${maxReportResult}\n\n` +
    //             `Horário do pico: ${maxReportTimeStampResult}\n\n` +
    //             `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
    //             `<${services.url} | Monitorar no Downdetector>`
    //     });

    //     console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
    //     return;
    // }


    // TUDO OK 
    // ============================================================
    console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
}
// '-' ============== FIM NUBANK ============== '-' //





















// '-' ============== INICIO BB ============== '-' //
async function tratarBB(services: any) {
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




    const maxReportResult = dados.max
    const peakTimeStamp = maxReport.x;
    const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



    //  WARNING
    // ============================================================
    if ((status === "warning") && !BBIncidente) {
        BBIncidente = {
            inicio: Date.now(),
            nivel: status,
            alertaEnviado: false
        }

        console.log(`primeiro status warning detectado para ${service}, iniciando contagem...`)
        return
    }

    if (status === "warning" && BBIncidente && !BBIncidente.alertaEnviado) {
        BBIncidente.nivel = "warning"

        const tempInterv: number = Date.now() - BBIncidente.inicio;

        const uma_hora: number = 3600000;

        if (tempInterv < uma_hora) {
            console.log("status warning ainda nao completou 1h")
            return
        }

        if (tempInterv >= uma_hora) {
            const emoji = ":warning:";
            const txt = "Instabilidade";

            await client.chat.postMessage({
                channel: config.slack.channel,
                text: `${emoji} *${txt} - ${service}*\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date(BBIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
            });
            BBIncidente.alertaEnviado = true;
            console.log(`Warning enviado no slack, detectado em ${service}, status é ${status}`);
            return;

        }
    }

    // PROBLEMA PIOROU warning -> danger
    // ============================================================

    if (status === "danger" && BBIncidente && BBIncidente.nivel === "warning") {
        BBIncidente.nivel = "danger";

        const emojii = ":alert:";
        const txtt = "critic";

        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `${emojii} *Nível Crítico - ${service}*\n• *Status:* \`${txtt}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver no Downdetector*>`
        });

        console.log(`msg enviado no slack, Problema agravou para DANGER no ${service}`);
        return;
    }


    //elaborar o reset quando o status estava warning ou danger e volta para o success, 
    // nao estou considerando as oscilações no momento de mandar notificação

    if (status === "success" && BBIncidente && BBIncidente.nivel === "warning" && !BBIncidente.alertaEnviado) {
        BBIncidente.nivel = "success"
        console.log(`${service} Oscilacao detectada, zerando contagem `)

        BBIncidente = null
    }



    // PROBLEMA RESOLVIDO (volta pra success)
    // ============================================================
    if (status === "success" && BBIncidente && BBIncidente.alertaEnviado) {
        const duracao = Date.now() - BBIncidente.inicio;
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

        const inicioIncidente = new Date(BBIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


        await client.chat.postMessage({
            channel: config.slack.channel,
            text: `:white_check_mark: *Normalizado* - *${service}*\n• *Status: \`resolved\`*\n• *Detectado em:* ${inicioIncidente}\n• *Fim:* ${fimIncidente}\n• *Duração:* ${duracaoTexto}\n\n<${services.url} | *Ver no Downdetector*>`
        });


        console.log(` Incidente no ${service}resolvido! Duração: ${duracaoTexto}`);
        BBIncidente = null;
        return;
    }


    // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
    // ============================================================
    if ((status === "warning" || status === "danger") && BBIncidente) {
        console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
        return;
    }




    // ALERTA DE PICO > 50 && sem incidente
    // ============================================================
    // if (maxReportResult > 50 && !NubankIncidente && status === "success") {
    //     if (peakTimeStamp === NubankUltimoPico) {
    //         console.log("já alertado, ignorando flasdfas...");
    //         return;
    //     }

    //     if (peakTimeStamp) {
    //         const peakTime = new Date(peakTimeStamp).getTime(); // sttring para número
    //         const now = Date.now();
    //         const minutosAtras = (now - peakTime) / (1000 * 60); // ms para minutos

    //         if (minutosAtras > 60) {
    //             console.log(`${service}: Pico de ${Math.floor(minutosAtras)}min atrás - ignorando`);
    //             return; // nem adianta continuar, pra pegar o pico atrasado, nem compensa
    //         }
    //     }

    //     NubankUltimoPico = peakTimeStamp;

    //     await client.chat.postMessage({
    //         channel: config.slack.channel,
    //         text: `Detectado alto volume de reclamações: ${service}\n\n` +
    //             `Reclamações: ${maxReportResult}\n\n` +
    //             `Horário do pico: ${maxReportTimeStampResult}\n\n` +
    //             `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
    //             `<${services.url} | Monitorar no Downdetector>`
    //     });

    //     console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
    //     return;
    // }


    // TUDO OK 
    // ============================================================
    console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
}
// '-' ============== FIM BB ============== '-' //




























// // '-' ============== INICIO Cloudflare ============== '-' //
// async function tratarCloudflare(services: any) {
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




//     const maxReportResult = dados.max
//     const peakTimeStamp = maxReport.x;
//     const maxReportTimeStampResult = peakTimeStamp ? new Date(peakTimeStamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A";



//     //  WARNING
//     // ============================================================
//     if ((status === "warning" || status === "danger") && !CloudflareIncidente) {
//         CloudflareIncidente = {
//             inicio: Date.now(),
//             nivel: status
//         };

//         const emoji = status === "danger" ? ":red_circle:" : ":warning:";
//         const txt = status === "danger" ? "Crítico | Instabilidade Grave" : "Alerta | Instabilidade ";

//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `> ${emoji} *${txt} - ${service}*\n*Status:* \`${status}\`\n\n*Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | *Ver detalhes no Downdetector*>`
//         });


//         console.log(`Warning ou danger detectado em ${service}, status é ${status}`);
//         return;
//     }


//     // PROBLEMA PIOROU warning -> danger
//     // ============================================================

//     if (status === "danger" && CloudflareIncidente && CloudflareIncidente.nivel === "warning") {
//         CloudflareIncidente.nivel = "danger";


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `> :red_circle: *SITUAÇÃO AGRAVOU!*\nInstabilidade com *${service}* atingiu nível CRÍTICO\n\n<${services.url} | *Ver detalhes no Downdetector*>`
//         });

//         console.log("Problema agravou para DANGER no ", service);
//         return;
//     }




//     // PROBLEMA RESOLVIDO (volta pra success)
//     // ============================================================
//     if (status === "success" && CloudflareIncidente) {
//         const duracao = Date.now() - CloudflareIncidente.inicio;
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

//         const inicioIncidente = new Date(CloudflareIncidente.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
//         const fimIncidente = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });


//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `> :large_green_circle: *NORMALIZADO* - *${service}*\n*Duração total:* ${duracaoTexto}\n\n*Início:* ${inicioIncidente}\n\n*Fim:* ${fimIncidente}\n\n<${services.url} | *Ver detalhes no Downdetector*>`
//         });


//         console.log(` Incidente resolvido! Duração: ${duracaoTexto}`);
//         CloudflareIncidente = null;
//         return;
//     }


//     // INCIDENTE JÁ ATIVO (não faz nada, só monitora)
//     // ============================================================
//     if ((status === "warning" || status === "danger") && CloudflareIncidente) {
//         console.log(`Incidente ${service}, status: ${status} ainda ativo...`);
//         return;
//     }




//     // ALERTA DE PICO > 50 && sem incidente
//     // ============================================================
//     // if (maxReportResult > 50 && !NubankIncidente && status === "success") {
//     //     if (peakTimeStamp === NubankUltimoPico) {
//     //         console.log("já alertado, ignorando flasdfas...");
//     //         return;
//     //     }

//     //     if (peakTimeStamp) {
//     //         const peakTime = new Date(peakTimeStamp).getTime(); // sttring para número
//     //         const now = Date.now();
//     //         const minutosAtras = (now - peakTime) / (1000 * 60); // ms para minutos

//     //         if (minutosAtras > 60) {
//     //             console.log(`${service}: Pico de ${Math.floor(minutosAtras)}min atrás - ignorando`);
//     //             return; // nem adianta continuar, pra pegar o pico atrasado, nem compensa
//     //         }
//     //     }

//     //     NubankUltimoPico = peakTimeStamp;

//     //     await client.chat.postMessage({
//     //         channel: config.slack.channel,
//     //         text: `Detectado alto volume de reclamações: ${service}\n\n` +
//     //             `Reclamações: ${maxReportResult}\n\n` +
//     //             `Horário do pico: ${maxReportTimeStampResult}\n\n` +
//     //             `Status oficial: \`${status}\` ( Nenhuma Instabilidade confirmada )\n\n` +
//     //             `<${services.url} | Monitorar no Downdetector>`
//     //     });

//     //     console.log(`Alerta de pico enviado para o serviço ${service} - reclamações: ${maxReportResult}`);
//     //     return;
//     // }


//     // TUDO OK 
//     // ============================================================
//     console.log(`${service} OK | Status: ${status} | Pico: ${maxReportResult}`);
// }
// // '-' ============== FIM tratarCloudflare ============== '-' //


























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
        else if (banco.nome === 'Bancodobrasil') {
            await tratarBB(banco);
        }
        // else if (banco.nome === 'Cloudflare') {
        //      await tratarCloudflare(banco);
        // }
        else if (banco.nome === 'Nubank') {
            await tratarNubank(banco);
        }
        // else if (banco.nome === 'Clearsale') {
        //     await tratarClearsale(banco);
        // }


    }

    console.log("é isso...");
}