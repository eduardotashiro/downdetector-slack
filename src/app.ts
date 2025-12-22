import { App, LogLevel } from "@slack/bolt";
import { config } from "./config/env.js";
import cron from "node-cron";
import { CheckAll } from "./slack/notifier/batchNotifier.js";

export const app = new App({
  signingSecret: config.slack.signingSecret,
  logLevel: LogLevel.INFO,
  token: config.slack.botToken,
});

cron.schedule("*/30 7-22 * * *", async () => {
 await CheckAll();
console.log("Monitoramento finalization! ",new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));
},{
  timezone:"America/Sao_Paulo"
}
);
