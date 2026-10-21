import { CheckAll } from "./notificationOrchestrator.js";
import { getRandomDelay } from "../utils/helpers.js";

export async function startMonitorLoop() {
	try {
		console.log(
			`Monitoramento iniciado`,
			new Date().toLocaleString("pt-BR", {
				timeZone: "America/Sao_Paulo",
			}),
		);
		await CheckAll();
		console.log(
			"Monitoramento finalizado",
			new Date().toLocaleString("pt-BR", {
				timeZone: "America/Sao_Paulo",
			}),
		);
	} catch (error) {
		console.error(`Erro no monitoramento:`, error);
	} finally {
		const delayMs = getRandomDelay(13, 31);
		console.log(
			`Próxima verificação em ~${(delayMs / 1000).toFixed(0)} segundos...`,
		);
		setTimeout(startMonitorLoop, delayMs);
	}
}
