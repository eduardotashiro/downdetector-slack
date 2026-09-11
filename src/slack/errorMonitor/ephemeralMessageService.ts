import { WebClient } from "@slack/web-api";

export class ErrorMessageEphemeral {
    private client: WebClient;
    private userId: string;
    private channel:string[];

    constructor(client: WebClient, userId: string,channels:string[]) {
        this.client = client;
        this.userId = userId;
        this.channel = channels;
    }
    
    async handle(errorMessage: string): Promise<void> {
        const user = this.userId
        const channel = this.channel
        const message = `:warning: *Erro no Bot de Monitoramento*\n\n• *Mensagem:* \`${errorMessage}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;

        await Promise.all(channel.map(ch => this.client.chat.postEphemeral({
            channel: ch,
            user,
            text: message
        })));
    }
}
