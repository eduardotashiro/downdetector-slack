import { vi, it, describe, expect } from "vitest";
import { IncidentMonitor } from "../incidentMonitor.js";
import { ServiceName, ServiceStatus, ServiceURL } from "../types.js";

const payloadDanger = {
    name: ServiceName.PIX,
    url: ServiceURL.PIX,
    data: {
        id: 54595,
        status: ServiceStatus.DANGER,
        company: ServiceName.PIX,
        max: 100,
        series: {
            reports: {
                data: [{ x: "2025-12-11T02:06:52+00:00", y: 100 }],
            }
        }
    }
}

const payloadSuccess = {
    name: ServiceName.PIX,
    url: ServiceURL.PIX,
    data: {
        id: 54595,
        status: ServiceStatus.SUCCESS,
        company: ServiceName.PIX,
        max: 100,
        series: {
            reports: {
                data: [{ x: "2025-12-11T02:06:52+00:00", y: 100 }],
            }
        }
    }
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
