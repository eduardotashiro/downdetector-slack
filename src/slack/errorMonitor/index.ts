import { WebClient, LogLevel } from "@slack/web-api"
import { config } from "../../config/env.js"

const client = new WebClient(config.slack.botToken, {
  logLevel: LogLevel.DEBUG,
});

const channelId = config.slack.channel;
const userId = config.slack.userId;

export async function sendEphemeralMessage(errorMessage: string): Promise<void> {

  const message = `:warning: *Erro no Bot de Monitoramento*\n\n• *Mensagem:* \`${errorMessage}\`\n• *Detectado em:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n`

  try {
    const result = await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: message
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
}