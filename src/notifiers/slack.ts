export class SlackNotifier {
	private webhooks: string[];

	constructor(webhooks: string[]) {
		this.webhooks = webhooks;
	}

	async sendDanger(name: string, url: string) {
		const messageDanger: string = `:alert: *Nível Crítico - ${name}*\n\n• *Status:* \`critic\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(",", " às")}\n\n<${url} | Ver no Downdetector>`;
		await this.sendMessage(messageDanger);
	}

	async sendSuccess(
		name: string,
		url: string,
		endOfIncident: string,
		incidentStart: string,
		timeText: string,
	) {
		const messageSuccess: string = `:white_check_mark: *Normalizado* - *${name}*\n\n• *Status:* \`resolved\`\n• *Detectado em:* ${incidentStart}\n• *Fim:* ${endOfIncident}\n• *Duração:* ${timeText}\n\n<${url} | Ver no Downdetector>`;
		await this.sendMessage(messageSuccess);
	}

	async sendError() {
		const errorMessage: string = `:warning: *Erro no Bot de Monitoramento*\n\n• *Mensagem:* \`Nenhum serviço foi verificado\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;
		await this.sendMessage(errorMessage);
	}

	private async sendMessage(message: string): Promise<void> {
		const result = await Promise.allSettled(
			this.webhooks.map(async (webhook) => {
				const response: Response = await fetch(webhook, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ text: message }),
				});
				if (!response.ok) {
					throw new Error(
						`HTTP Fail to sendMessage: ${response.status}`,
					);
				}
			}),
		);

		// TODO: implementar retry para webhook que faia
		if (result.some((response) => response.status === "rejected")) {
			throw new Error(
				"Falha ao enviar mensagem para um ou mais webhooks",
			);
		}
	}
}
