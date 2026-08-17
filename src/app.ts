import { App, LogLevel, } from "@slack/bolt";
import { config } from "./config/env.js";

import pkg from "@slack/bolt";
const { ExpressReceiver } = pkg;

const receiver = new ExpressReceiver({
    signingSecret: config.slack.signingSecret,
});

export const app = new App({
  token: config.slack.botToken,
  logLevel: LogLevel.INFO,
  receiver,
});

export const expressApp = receiver.app;