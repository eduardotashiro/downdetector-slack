import { Camoufox } from "camoufox";
import type { Browser } from "playwright-core";

export async function launchBrowser() {
	return (await Camoufox({
		headless: false,
		os: "linux",
		humanize: true,
		geoip: true,
		block_webrtc: true,
		window: [1920, 1080],
	})) as Browser;
}
