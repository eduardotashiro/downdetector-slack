import { App, LogLevel } from "@slack/bolt";
import { CheckAll } from "./slack/batchNotifier.js";
import { config } from "./config/env.js";
import cron from "node-cron";

export const app = new App({
  signingSecret: config.slack.signingSecret,
  logLevel: LogLevel.INFO,
  token: config.slack.botToken,
});


cron.schedule("*/15 * * * *", run,
  {
    timezone: "America/Sao_Paulo"
  }
);

async function run() {
  try {
    console.log(`Monitoramento iniciado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
    await CheckAll();
    console.log(`Monitoramento finalizado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  } catch (error) {
    console.error(`Erro no monitoramento:`, error);
  }
}




