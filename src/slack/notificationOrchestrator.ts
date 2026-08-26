import { errorMessageEphemeral } from "../slack/errorMonitor/ephemeralAlert.js"
import { checkAllServices } from "../services/downdetectorService.js";
import { IncidentMonitor } from "./incidentMonitor.js";
import { errorMessageDM } from "../slack/errorMonitor/dmAlert.js"
import { ServiceName } from "./types.js";
import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";

const client = new WebClient(config.slack.botToken);
const channel = config.slack.channel

const monitors = {} as Record<ServiceName, IncidentMonitor>;

for (const name of Object.values(ServiceName)) {
    monitors[name] = new IncidentMonitor(client, channel);
}

export async function CheckAll() {
    const servicesResult = await checkAllServices();
    if (servicesResult.length === 0) {
        const errorMessage = `Nenhum serviço foi verificado`;
         await errorMessageEphemeral.handle(errorMessage);
          await errorMessageDM.handle(errorMessage);
    }

    await Promise.all(servicesResult.map(async (services) => {
        const handler = monitors[services.name];
        if (handler) await handler.handle(services);
    }));

}

