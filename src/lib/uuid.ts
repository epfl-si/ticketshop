export function generateUUID(): string {
	const timestamp = Date.now().toString(16);
	const randomPart = () => Math.random().toString(16).substring(2, 15);

	const hex = (timestamp + randomPart() + randomPart() + randomPart()).padEnd(32, "0").substring(0, 32);

	return [
		hex.substring(0, 8),
		hex.substring(8, 12),
		"4" + hex.substring(13, 16),
		((parseInt(hex.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hex.substring(17, 20),
		hex.substring(20, 32),
	].join("-");
}
