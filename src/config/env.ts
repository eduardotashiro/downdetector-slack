import dotenv from "dotenv"
dotenv.config()

export const config = {
    slack:{
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
    },
    slackId:{
        Eduardo:process.env.EDUARDO!
    }
}