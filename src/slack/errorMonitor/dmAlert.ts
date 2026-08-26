import {ErrorMessageDM} from "./directMessageService.js";
import { WebClient } from "@slack/web-api";
import { config } from "../../config/env.js";

const client = new WebClient(config.slack.botToken);
const userId = config.slack.userId;

export const errorMessageDM = new ErrorMessageDM(client, userId);