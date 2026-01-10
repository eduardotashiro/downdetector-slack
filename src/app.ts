import { App, LogLevel } from "@slack/bolt";
import { config } from "./config/env.js";
import cron from "node-cron";
import { CheckAll } from "./slack/notifier/batchNotifier.js";

export const app = new App({
  signingSecret: config.slack.signingSecret,
  logLevel: LogLevel.INFO,
  token: config.slack.botToken,
});
// //mudei de ideia das 6h as 23h rodando de 15 em 15 min, ta bom até demais 
// // cron.schedule("*/15 6-23 * * *", async () => {
// //  await CheckAll();
// // console.log("Monitoramento finalization! ",new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));
// // },{
// //   timezone:"America/Sao_Paulo"
// // }
// // );

// CheckAll();

const randomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Roda a cada 15 minutos, MAS com delay aleatório no início
cron.schedule("*/15 * * * *", async () => {
  // Delay aleatório de 0-3 minutos antes de começar
  const initialDelay = randomDelay(0, 3 * 60 * 1000);

  console.log(`Aguardando ${(initialDelay / 1000 / 60).toFixed(1)} min...`);

  await sleep(initialDelay);

  const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  console.log(`Iniciando monitoramento: ${timestamp}`);

  try {
    await CheckAll();
    console.log(`finalization: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);

  } catch (error) {
    console.error(`Erro no monitoramento:`, error);
  }
},
  {
    timezone: "America/Sao_Paulo"
  }
);