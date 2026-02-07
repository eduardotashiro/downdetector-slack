import { CheckAll } from "../slack/batchNotifier.js";
import cron from "node-cron";



cron.schedule("*/5 * * * *", run,
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
};
