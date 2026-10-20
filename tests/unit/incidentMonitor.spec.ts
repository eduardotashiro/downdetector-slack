import { beforeEach, vi, it, describe, expect } from "vitest";
import { IncidentMonitor } from "../../src/core/incidentMonitor.js";
import { ServiceStatus } from "../../src/core/types.js";
import type { ServiceResult, IncidentNotifier } from "../../src/core/types.js";

beforeEach(() => {
	mockSendDanger.mockClear();
	mockSendSuccess.mockClear();
});

const mockSendDanger = vi.fn().mockResolvedValue(undefined);
const mockSendSuccess = vi.fn().mockResolvedValue(undefined);

const mockNotifier: IncidentNotifier = {
	sendDanger: mockSendDanger,
	sendSuccess: mockSendSuccess,
};

const payloadDanger: ServiceResult = {
	name: "Bradesco",
	url: "https://downdetector.com.br/fora-do-ar/bradesco/",
	outage: ServiceStatus.DANGER,
};

const payloadSuccess: ServiceResult = {
	...payloadDanger,
	outage: ServiceStatus.SUCCESS,
};

describe("IncidentMonitor", () => {
	it("should send alert when is DANGER states", async () => {
		const monitor = new IncidentMonitor(mockNotifier);

		await monitor.handle(payloadDanger);

		expect(mockSendDanger).toHaveBeenCalledTimes(1);
	});

	it("should not send twice when already in incident and is DANGER states", async () => {
		const monitor = new IncidentMonitor(mockNotifier);

		await monitor.handle(payloadDanger);
		await monitor.handle(payloadDanger);

		expect(mockSendDanger).toHaveBeenCalledTimes(1);
	});

	it("should send resolution when status becomes SUCCESS", async () => {
		const monitor = new IncidentMonitor(mockNotifier);

		await monitor.handle(payloadDanger);
		await monitor.handle(payloadSuccess);

		expect(mockSendDanger).toHaveBeenCalledTimes(1);
		expect(mockSendSuccess).toHaveBeenCalledTimes(1);
	});

	it("should send a new alert after incident is resolved", async () => {
		const monitor = new IncidentMonitor(mockNotifier);

		await monitor.handle(payloadDanger);
		await monitor.handle(payloadSuccess);
		await monitor.handle(payloadDanger);

		expect(mockSendDanger).toHaveBeenCalledTimes(2);
		expect(mockSendSuccess).toHaveBeenCalledTimes(1);
	});
});
