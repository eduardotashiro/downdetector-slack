import { vi, it, describe, expect } from "vitest";
import { IncidentMonitor } from "../incidentMonitor.js";
import { ServiceName, ServiceURL, ServiceStatus } from "../types.js";

const payloadDanger = {
    name: ServiceName.BRADESCO,
    url: ServiceURL.BRADESCO,
    outage: ServiceStatus.DANGER
}

const payloadSuccess = {
    name: ServiceName.BRADESCO,
    url: ServiceURL.BRADESCO,
    outage: ServiceStatus.SUCCESS
}

describe("IncidentMonitor", () => {
    it("should send alert when is DANGER states", async () => {
        const mockPostMessage = vi.fn()
        const mockClient = {
            chat: {
                postMessage: mockPostMessage
            }
        } as any;

        const monitor = new IncidentMonitor(mockClient, "C98E7US65TS")

        await monitor.handle(payloadDanger)

        expect(mockPostMessage).toHaveBeenCalledOnce();
    })

    it("should not send twice when already in incident and is DANGER states", async () => {
        const mockPostMessage = vi.fn()
        const mockClient = {
            chat: {
                postMessage: mockPostMessage
            }
        } as any;

        const monitor = new IncidentMonitor(mockClient, "C98E7US65TS")

        await monitor.handle(payloadDanger)
        await monitor.handle(payloadDanger)

        expect(mockPostMessage).toHaveBeenCalledOnce();
    })

    it("should send resolution when status becomes SUCCESS", async () => {
        const mockPostMessage = vi.fn()
        const mockClient = {
            chat: {
                postMessage: mockPostMessage
            }
        } as any;

        const monitor = new IncidentMonitor(mockClient, "C98E7US65TS")

        await monitor.handle(payloadDanger)
        await monitor.handle(payloadSuccess)

        expect(mockPostMessage).toHaveBeenCalledTimes(2);
    })
})