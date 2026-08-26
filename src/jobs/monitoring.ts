import { CheckAll } from "../slack/notificationOrchestrator.js";

function getRandomDelay(minMinutes: number, maxMinutes: number): number {
    const minMs = minMinutes * 60000;
    const maxMs = maxMinutes * 60000;
    const randomMs = Math.random() * (maxMs - minMs + 1) + minMs;
    const delayMs = Math.floor(randomMs);
    return delayMs;
}

function logMem(label: string) {
    const m = process.memoryUsage();
    const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
    console.log(
        `${label} RSS: ${mb(m.rss)}MB | Heap: ${mb(m.heapUsed)}/${mb(m.heapTotal)}MB | External: ${mb(m.external)}MB | ArrayBuffers: ${mb(m.arrayBuffers)}MB`
    );
    return m;
}

async function run() {
    try {
        if (global.gc) global.gc();
        const memBefore = logMem("ANTES");

        await CheckAll();

        if (global.gc) global.gc();
        const memAfter = logMem("DEPOIS");

        const diffRss = ((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(1);
        const diffExternal = ((memAfter.external - memBefore.external) / 1024 / 1024).toFixed(1);
        console.log(`VARIAÇÃO RSS: ${diffRss} MB | VARIAÇÃO EXTERNAL: ${diffExternal} MB`);

    } catch (error) {
        console.error(`Erro no monitoramento:`, error);
    }

    const delayMs = getRandomDelay(2, 3);
    console.log(`Próxima verificação em ~${Math.round(delayMs / 60000)} minutos...`);
    setTimeout(run, delayMs);
}

console.log('Monitoramento iniciado');
run();