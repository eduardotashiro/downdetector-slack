import { WebClient } from "@slack/web-api";

export class ErrorMonitor {
    private client: WebClient;
    private userId: string;

    constructor(client: WebClient, userId: string) {
        this.client = client;
        this.userId = userId;
    }
    
    async handle(errorMessage: string): Promise<void> {

        const dm = await this.client.conversations.open({
            users: this.userId
        });

        const message = `:warning: *Erro no Bot de Monitoramento*\n\n• *Mensagem:* \`${errorMessage}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;

        await this.client.chat.postMessage({
            channel: dm.channel!.id!,
            text: message
        });
    }
}
