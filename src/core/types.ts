export enum ServiceStatus {
	SUCCESS = "success",
	DANGER = "danger",
	WARNING = "warning",
}

export interface MonitoredService {
	name: string;
	url: string;
}

export interface ServiceResult extends MonitoredService {
	outage: ServiceStatus;
}

export interface IncidentNotifier {
	sendDanger(name: string, url: string): Promise<void>;
	sendSuccess(
		name: string,
		url: string,
		endOfIncident: string,
		incidentStart: string,
		timeText: string,
	): Promise<void>;
}
