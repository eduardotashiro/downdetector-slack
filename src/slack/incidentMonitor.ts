import { WebClient } from "@slack/web-api";
import { config } from "../config/env.js";
import { ServiceStatus } from "./types.js";

export class IncidentMonitor {
  private client: WebClient;
  private incidente: {
    inicio: number;
    nivel: ServiceStatus;
    alertaEnviado: boolean;
  } | null = null;