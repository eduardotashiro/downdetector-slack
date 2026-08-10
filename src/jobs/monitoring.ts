import { CheckAll } from "../slack/notificationOrchestrator.js";
import cron from "node-cron";


// (*/4... // não diminuir o intervalo abaixo de 4 minutos
cron.schedule("*/4 * * * *", run,
  {
    timezone: "America/Sao_Paulo"
  }
);

run();

async function run() {
  try {
    console.log(`Monitoramento iniciado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
    await CheckAll();
    console.log(`Monitoramento finalizado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  } catch (error) {
    console.error(`Erro no monitoramento:`, error);
  }
}