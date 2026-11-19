const FENCE_OPEN_PATTERN = /^ {0,3}(?:(`{3,})[^`]*$|(~{3,}))/;
const FRONTMATTER_DELIMITER_PATTERN = /^---\s*$/;
const FRONTMATTER_CLOSE_PATTERN = /^(---|\.\.\.)\s*$/;
const SECTION_HEADING_PATTERN = /^#{1,2}(\s|$)/;

/**
 * Marks lines that must never be treated as tasks or headings:
 * YAML frontmatter and the contents of top-level fenced code blocks
 * (including the fence lines themselves). Returns null if a fence is unclosed.
 */
export function findProtectedLines(lines: string[]): boolean[] | null {
	const protectedLines: boolean[] = new Array<boolean>(lines.length).fill(false);
	let index = markFrontmatter(lines, protectedLines);

	while (index < lines.length) {
		const opening = (lines[index] ?? "").match(FENCE_OPEN_PATTERN);
		const fence = opening?.[1] ?? opening?.[2];
		if (fence === undefined) {
			index += 1;
			continue;
		}

		const closePattern = new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`);
		let end = index + 1;
		while (end < lines.length && !closePattern.test(lines[end] ?? "")) {
			end += 1;
		}

		if (end === lines.length) {
			return null;
		}
		for (let protectedIndex = index; protectedIndex <= end; protectedIndex += 1) {
			protectedLines[protectedIndex] = true;
		}
		index = end + 1;
	}

	return protectedLines;
}

function markFrontmatter(lines: string[], protectedLines: boolean[]): number {
	if (!FRONTMATTER_DELIMITER_PATTERN.test(lines[0] ?? "")) {
		return 0;
	}

	for (let index = 1; index < lines.length; index += 1) {
		if (FRONTMATTER_CLOSE_PATTERN.test(lines[index] ?? "")) {
			for (let protectedIndex = 0; protectedIndex <= index; protectedIndex += 1) {
				protectedLines[protectedIndex] = true;
			}
			return index + 1;
		}
	}

	// No closing delimiter: not frontmatter.
	return 0;
}

/**
 * Finds the managed Done heading: the last matching heading that is not
 * followed by any other level 1 or 2 heading. Returns its line index, or -1.
 * A Done heading followed by other sections belongs to the user and is left alone.
 */
export function findManagedHeading(
	lines: string[],
	protectedLines: boolean[],
	headingPattern: RegExp,
): number {
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const line = lines[index] ?? "";
		if (protectedLines[index]) {
			continue;
		}

		if (headingPattern.test(line)) {
			return index;
		}

		if (SECTION_HEADING_PATTERN.test(line)) {
			return -1;
		}
	}

	return -1;
}
