import { CheckAll } from "../slack/notificationOrchestrator.js";

function getRandomDelay(minMinutes: number, maxMinutes: number): number {
    const minMs = minMinutes * 60000;
    const maxMs = maxMinutes * 60000;
    const randomMs = Math.random() * (maxMs - minMs + 1) + minMs;
    const delayMs = Math.floor(randomMs);
    return delayMs;
}

async function run() {
    try {
        console.log(`Monitoramento iniciado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);

        const memBefore = process.memoryUsage();
        console.log(`ANTES - RSS: ${(memBefore.rss / 1024 / 1024).toFixed(1)}MB | Heap: ${(memBefore.heapUsed / 1024 / 1024).toFixed(1)}MB | External: ${(memBefore.external / 1024 / 1024).toFixed(1)}MB`);

        await CheckAll();

        const memAfter = process.memoryUsage();
        console.log(`DEPOIS - RSS: ${(memAfter.rss / 1024 / 1024).toFixed(1)}MB | Heap: ${(memAfter.heapUsed / 1024 / 1024).toFixed(1)}MB | External: ${(memAfter.external / 1024 / 1024).toFixed(1)}MB`);

        console.log(`Monitoramento finalizado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n`);
    } catch (error) {
        console.error(`Erro no monitoramento:`, error);
    }
    const delayMs = getRandomDelay(2, 4);
    console.log(`⏳ Próxima verificação em ~${Math.round(delayMs / 60000)} minutos...`);
    setTimeout(run, delayMs);
}

console.log('Monitoramento iniciado');
run();