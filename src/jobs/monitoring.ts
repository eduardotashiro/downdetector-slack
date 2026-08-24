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
        if (global.gc) global.gc();

        const memBefore = process.memoryUsage();
        console.log(`ANTES RSS: ${(memBefore.rss / 1024 / 1024).toFixed(1)}MB | Heap: ${(memBefore.heapUsed / 1024 / 1024).toFixed(1)}MB`);

        await CheckAll();

        if (global.gc) global.gc();

        const memAfter = process.memoryUsage();
        console.log(`DEPOIS RSS: ${(memAfter.rss / 1024 / 1024).toFixed(1)}MB | Heap: ${(memAfter.heapUsed / 1024 / 1024).toFixed(1)}MB`);

        const diffRss = ((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(1);
        console.log(`VARIAÇÃO RSS: ${diffRss} MB`);

    } catch (error) {
        console.error(`Erro no monitoramento:`, error);
    }

    const delayMs = getRandomDelay(2, 3);
    console.log(`Próxima verificação em ~${Math.round(delayMs / 60000)} minutos...`);
    setTimeout(run, delayMs);
}

console.log('Monitoramento iniciado');
run();