import dotenv from "dotenv"
dotenv.config()

const requiredEnv = [
    "SLACK_SIGNING_SECRET",
    "SLACK_BOT_TOKEN",
    "CHANNEL_ID",
    "USER_ID",
    "PORT"
];

const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (missingEnv.length > 0) {
    throw new Error(`variáveis não encontradas no .env: ${missingEnv.join(", ")} `);
}

export const config = {
    slack: {
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        botToken: process.env.SLACK_BOT_TOKEN!,
        channel: process.env.CHANNEL_ID!,
        userId: process.env.USER_ID!,
        port: process.env.PORT!
    }
}
