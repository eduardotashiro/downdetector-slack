import { WebClient } from "@slack/web-api";

export class ErrorMessageEphemeral {
    private client: WebClient;
    private userId: string;
    private channel:string

    constructor(client: WebClient, userId: string,channel:string) {
        this.client = client;
        this.userId = userId;
        this.channel = channel;
    }
    
    async handle(errorMessage: string): Promise<void> {
        const user = this.userId
        const channel = this.channel
        const message = `:warning: *Erro no Bot de Monitoramento*\n\n• *Mensagem:* \`${errorMessage}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;

        await this.client.chat.postEphemeral({
            channel,
            user,
            text: message
        });
    }
}
