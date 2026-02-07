import { App, LogLevel } from "@slack/bolt";
import { config } from "./config/env.js";


export const app = new App({
  signingSecret: config.slack.signingSecret,
  logLevel: LogLevel.INFO,
  token: config.slack.botToken,
});






