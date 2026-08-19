import dotenv from "dotenv"
dotenv.config()

export const config = {
    slack:{
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        channel: process.env.CHANNEL_ID!,
        userId: process.env.USER_ID!
    }
}