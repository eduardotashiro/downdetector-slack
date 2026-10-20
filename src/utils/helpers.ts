

export function shuffleArray<T>(array: T[]): void {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

export function getRandomDelay(minSeconds: number, maxSeconds: number): number {
	const minMs = minSeconds * 1000;
	const maxMs = maxSeconds * 1000;
	return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
