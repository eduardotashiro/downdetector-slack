import { LogLevel, WebClient } from "@slack/web-api";
import { config } from "../../config/env.js"
import { ErrorMessageEphemeral } from "./ephemeralMessageService.js"

const client = new WebClient(config.slack.botToken, {
    logLevel: LogLevel.DEBUG,
});

const channel = config.slack.channel
const userID = config.slack.userId

export const errorMessageEphemeral = new ErrorMessageEphemeral(client, userID, channel,)