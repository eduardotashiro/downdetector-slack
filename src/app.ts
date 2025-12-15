import { App, LogLevel } from "@slack/bolt";
import { config } from "./config/env";
// import cron from "node-cron";
import { CheckAll } from "./slack/notifier/batchNotifier";

export const app = new App({
  signingSecret: config.slack.signingSecret,
  logLevel: LogLevel.INFO,
  token: config.slack.botToken,
});

// cron.schedule("*/30 7-22 * * *", async () => {
//   await verificarTudoDeUmaVez();
// console.log("Monitoramento finalization!");

// });


CheckAll().then(() => {
  console.log("Teste completo!");
  process.exit(0);
});

