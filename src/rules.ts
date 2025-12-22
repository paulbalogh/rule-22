export function to8BitBinary(decimal: number): string {
	if (!Number.isInteger(decimal) || decimal < 0 || decimal > 255) {
		throw new Error(`Rule must be an integer in [0, 255]. Got: ${decimal}`);
	}
	return decimal.toString(2).padStart(8, "0");
}
