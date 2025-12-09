import { App, LogLevel } from "@slack/bolt";
import { config } from "./config/env";
import {sendSlackMessage} from "./slack/notifier/slackNotifier";
// import cron from "node-cron";

export const app = new App({
  signingSecret: config.slack.signingSecret,
  logLevel: LogLevel.INFO,
  token: config.slack.botToken,
});

// cron.schedule("*/30 * * * *", async () => {      
// await sendSlackMessage();   
// });

sendSlackMessage(); 
