import { CheckAll } from "../slack/batchNotifier.js";
import cron from "node-cron";


// (*/5... não diminua 
cron.schedule("*/5 6-23 * * *", run,
  {
    timezone: "America/Sao_Paulo"
  }
);
cron.schedule("*/5 0-1 * * *", run,
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
