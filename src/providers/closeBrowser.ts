import type { Browser } from "playwright-core";

export async function forceCloseBrowser(
	browser?: Browser,
	timeoutMs: number = 1000,
): Promise<void> {
	if (!browser) return;
	try {
		await Promise.race([
			(async () => {
				if (browser.isConnected()) await browser.close();
			})(),
			new Promise<void>((_, reject) =>
				setTimeout(
					() => reject(new Error("timeout no close")),
					timeoutMs,
				),
			),
		]);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(
				`close normal não confirmou sucesso: ${error.message}`,
			);
		}
	}
}
