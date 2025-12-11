import dotenv from "dotenv"
dotenv.config()

export const config = {
    slack:{
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        channel: process.env.CHANNEL_ID!
    },
    slackId:{
        Eduardo:process.env.EDUARDO!
    },
    proxy:{
        server: process.env.PROXY_SERVER!,
        username: process.env.PROXY_USERNAME!,
        password: process.env.PROXY_PASSWORD!
    }
}



