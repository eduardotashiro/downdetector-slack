import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { SlackNotifier } from "../../src/notifiers/slack";

describe("SlackNotifier", () => {
	const webhooks = ["https://example.com/whk-1", "https://example.com/whk-2"];
	const notifier = new SlackNotifier(webhooks);
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockReset();
		vi.stubGlobal("fetch", mockFetch);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("should send the msg to both webhooks", async () => {
		mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

		await expect(
			notifier.sendDanger("Bradesco", "https://example.com/bradesco"),
		).resolves.toBeUndefined();

		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("should throw an err if one webhook fails", async () => {
		mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
		mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

		await expect(
			notifier.sendDanger("Bradesco", "https://example.com/bradesco"),
		).rejects.toThrow();

		expect(mockFetch).toHaveBeenCalledTimes(2);
	});
});
