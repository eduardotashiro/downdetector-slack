// import { WebClient } from "@slack/web-api";
// import { config } from "../config/env.js";

// const client = new WebClient(config.slack.botToken);

// const janelaTemp = 15 * 60 * 1000;
// const servicesMax = 3;

// let janelaInicio: number | null = null;
// let servicosEmWarning = new Set();
// let alertaEnviado = false;

// export async function registrarWarningGlobal(services:any) {
//     const data = services.data;
//     const status = data.status;
//     const service = data.company;

//     const agora = Date.now();
//     if (!janelaInicio) {
//         janelaInicio = agora;
//         servicosEmWarning.clear();
//         alertaEnviado = false;
//     }

//     if (agora - janelaInicio > janelaTemp) {
//         janelaInicio = agora;
//         servicosEmWarning.clear();
//         alertaEnviado = false;
//     }

//     servicosEmWarning.add(service);

//     console.log(
//         `GLOBAL WARNING ${service} | Total na janela: ${servicosEmWarning.size}`
//     );

//     if (servicosEmWarning.size >= servicesMax && !alertaEnviado) {

//         const emoji = ":warning:";
//         const txt = "Instabilidade";
//         await client.chat.postMessage({
//             channel: config.slack.channel,
//             text: `${emoji} *${txt} - ${service}*\n\n• *Status:* \`${status}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n<${services.url} | Ver no Downdetector>`
//         });

//         alertaEnviado = true;
//         console.log(`[GLOBAL WARNING] ALERTA DISPARADO`);
//     }
// }
