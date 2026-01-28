import { App, LogLevel } from "@slack/bolt";
import { CheckAll } from "./slack/batchNotifier.js";
import { config } from "./config/env.js";
import cron from "node-cron";

export const app = new App({
  signingSecret: config.slack.signingSecret,
  logLevel: LogLevel.INFO,
  token: config.slack.botToken,
});

const randomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

cron.schedule("*/15 * * * *", async () => {
  const MIN = 0;
  const MAX = 3 * 60 * 1000;
  const initialDelay = randomDelay(MIN, MAX);
  console.log(`Aguardando ${(initialDelay / 1000 / 60).toFixed(1)} min...`);
  await sleep(initialDelay);

  const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  console.log(`Iniciando monitoramento: ${timestamp}`);

  try {
    await CheckAll();
    console.log(`Monitoramento finalizado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);

  } catch (error) {
    console.error(`Erro no monitoramento:`, error);
  }
},
  {
    timezone: "America/Sao_Paulo"
  }
);