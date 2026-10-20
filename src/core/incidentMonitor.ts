import type { IncidentNotifier, ServiceResult } from "./types.js";
import { ServiceStatus } from "./types.js";

export class IncidentMonitor {
	private incident: {
		startedAt: number;
		alertSent: boolean;
	} | null = null;

	constructor(private notifier: IncidentNotifier) {}
	async handle(services: ServiceResult): Promise<void> {
		const { name, url, outage: status } = services;

		if (status === ServiceStatus.DANGER && !this.incident) {
			this.incident = {
				startedAt: Date.now(),
				alertSent: false,
			};

			await this.notifier.sendDanger(name, url);

			this.incident.alertSent = true;
			console.log(
				`STATUS ${ServiceStatus.DANGER} 🔴 PARA ${name} ENVIADO NO SLACK !`,
			);
			return;
		}

		if (
			status === ServiceStatus.SUCCESS &&
			this.incident &&
			this.incident.alertSent
		) {
			const time = Date.now() - this.incident.startedAt;
			const minutes = Math.floor(time / 60000);
			const hours = Math.floor(minutes / 60);
			const minutesRemaining = minutes % 60;

			let timeText = "";
			if (hours > 0) {
				timeText = `${hours}h ${minutesRemaining}min`;
			} else if (minutes > 0) {
				timeText = `${minutes}min`;
			}
			const incidentStart = new Date(this.incident.startedAt)
				.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
				.replace(",", " às");
			const endOfIncident = new Date()
				.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
				.replace(",", " às");

			await this.notifier.sendSuccess(
				name,
				url,
				endOfIncident,
				incidentStart,
				timeText,
			);

			console.log(
				`INCIDENTE NO ${name} RESOLVIDO ! DURAÇÃO: ${timeText}`,
			);

			this.incident = null;
			return;
		}

		if (status === ServiceStatus.WARNING) {
			console.log(`⚠️ ${name}: possíveis problemas (warning)`);
			return;
		}

		if (status === ServiceStatus.DANGER && this.incident) {
			console.log(
				`INCIDENTE EM ${name} | STATUS: ${status}, AINDA ATIVO...`,
			);
			return;
		}
	}
}
