import { findManagedHeading, findProtectedLines } from "./markdownStructure";

export const COMPLETED_TASKS_HEADING = "## Done";

const COMPLETED_TASKS_HEADING_PATTERN = /^## Done\s*$/;
const TOP_LEVEL_COMPLETED_TASK_PATTERN = /^[-*+] \[[xX]\].*$/;
const INDENTED_LINE_PATTERN = /^[ \t]/;
export const BLOCK_ID_TRAILING_PATTERN = /\s+\^[A-Za-z0-9-]+$/;
export const COMPLETION_DATE_TRAILING_PATTERN = /\s+\(\d{4}-\d{2}-\d{2}\)$/;

export interface SweepResult {
	content: string;
	didChange: boolean;
	movedCount: number;
	totalCompletedCount: number;
	skippedReason?: "unclosed-code-fence";
}

/**
 * True when a single line went from an incomplete to a completed top-level task.
 * Callers compare only lines that an edit actually touched.
 */
export function isCompletionToggle(oldLine: string, newLine: string): boolean {
	return isIncompleteTopLevelTask(oldLine) && isCompletedTopLevelTask(newLine);
}

export function sweepCompletedTasks(content: string): SweepResult {
	const newline = detectNewline(content);
	const completedDate = formatToday();
	const normalizedContent = content.replace(/\r\n/g, "\n");
	const hasTrailingNewline = normalizedContent.endsWith("\n");
	const body = hasTrailingNewline ? normalizedContent.slice(0, -1) : normalizedContent;
	const lines = body.length > 0 ? body.split("\n") : [];
	const protectedLines = findProtectedLines(lines);
	if (protectedLines === null) {
		return {
			content,
			didChange: false,
			movedCount: 0,
			totalCompletedCount: 0,
			skippedReason: "unclosed-code-fence",
		};
	}

	// The managed section always runs to the end of the note.
	const headingIndex = findManagedHeading(
		lines,
		protectedLines,
		COMPLETED_TASKS_HEADING_PATTERN,
	);
	const outsideEnd = headingIndex === -1 ? lines.length : headingIndex;
	const managedStart = headingIndex === -1 ? lines.length : headingIndex + 1;

	const { keptLines, blocks: movedBlocks } = extractCompletedBlocks(
		lines.slice(0, outsideEnd),
		protectedLines.slice(0, outsideEnd),
	);
	const { keptLines: preservedManagedLines, blocks: existingBlocks } =
		extractCompletedBlocks(
			lines.slice(managedStart),
			protectedLines.slice(managedStart),
		);

	const allCompletedBlocks = [...movedBlocks, ...existingBlocks].map((block) =>
		annotateBlock(block, completedDate),
	);
	const allCompletedTasks = allCompletedBlocks.flat();
	if (allCompletedTasks.length === 0) {
		return {
			content,
			didChange: false,
			movedCount: 0,
			totalCompletedCount: 0,
		};
	}

	const rebuiltLines = buildReorderedLines(
		keptLines,
		preservedManagedLines,
		allCompletedTasks,
	);
	const nextContent = joinLines(rebuiltLines, newline, hasTrailingNewline);

	return {
		content: nextContent,
		didChange: nextContent !== content,
		movedCount: nextContent === content ? 0 : movedBlocks.length,
		totalCompletedCount: allCompletedBlocks.length,
	};
}

interface ExtractedBlocks {
	keptLines: string[];
	blocks: string[][];
}

/**
 * Splits lines into completed top-level task blocks and everything else.
 * A block is a completed top-level task plus all following indented lines
 * (child tasks, notes, code). Blank lines inside a block are kept only when
 * more indented lines follow them.
 */
function extractCompletedBlocks(
	lines: string[],
	protectedLines: boolean[],
): ExtractedBlocks {
	const keptLines: string[] = [];
	const blocks: string[][] = [];

	let index = 0;
	while (index < lines.length) {
		const line = lines[index] ?? "";
		if (protectedLines[index] || !isCompletedTopLevelTask(line)) {
			keptLines.push(line);
			index += 1;
			continue;
		}

		const end = findBlockEnd(lines, index);
		blocks.push(lines.slice(index, end));
		index = end;

		// Don't leave a doubled blank gap (or a leading blank line) where the block was.
		const previousIsGap = keptLines.length === 0 || keptLines[keptLines.length - 1] === "";
		if (previousIsGap && lines[index] === "") {
			index += 1;
		}
	}

	return { keptLines, blocks };
}

function findBlockEnd(lines: string[], start: number): number {
	let end = start + 1;
	for (let index = start + 1; index < lines.length; index += 1) {
		const line = lines[index] ?? "";
		if (line.trim() === "") {
			continue;
		}

		if (!INDENTED_LINE_PATTERN.test(line)) {
			break;
		}

		end = index + 1;
	}

	return end;
}

function annotateBlock(block: string[], completedDate: string): string[] {
	const [first, ...rest] = block;
	if (first === undefined) {
		return block;
	}

	return [appendCompletionDate(first, completedDate), ...rest];
}

function buildReorderedLines(
	keptLines: string[],
	preservedManagedLines: string[],
	completedTasks: string[],
): string[] {
	const result = [...keptLines];
	trimTrailingBlankLines(result);

	if (result.length > 0) {
		result.push("");
	}

	result.push(COMPLETED_TASKS_HEADING);
	result.push("");

	const normalizedManagedLines = trimBlankEdges(preservedManagedLines);
	if (normalizedManagedLines.length > 0) {
		result.push(...normalizedManagedLines);
		result.push("");
	}

	result.push(...completedTasks);
	return result;
}

function isCompletedTopLevelTask(line: string): boolean {
	return TOP_LEVEL_COMPLETED_TASK_PATTERN.test(line);
}

function isIncompleteTopLevelTask(line: string): boolean {
	return /^[-*+] \[ \].*$/.test(line);
}

function appendCompletionDate(line: string, completedDate: string): string {
	const trimmed = line.trimEnd();
	const blockIdMatch = trimmed.match(BLOCK_ID_TRAILING_PATTERN);
	const blockId = blockIdMatch ? blockIdMatch[0] : "";
	const body = blockId ? trimmed.slice(0, -blockId.length) : trimmed;

	if (COMPLETION_DATE_TRAILING_PATTERN.test(body)) {
		return trimmed;
	}

	return `${body} (${completedDate})${blockId}`;
}

function formatToday(): string {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function detectNewline(content: string): string {
	const newlineMatch = content.match(/\r\n|\n/);
	return newlineMatch?.[0] ?? "\n";
}

function joinLines(
	lines: string[],
	newline: string,
	hasTrailingNewline: boolean,
): string {
	if (lines.length === 0) {
		return "";
	}

	const joined = lines.join(newline);
	return hasTrailingNewline ? `${joined}${newline}` : joined;
}

function trimTrailingBlankLines(lines: string[]): void {
	while (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}
}

function trimBlankEdges(lines: string[]): string[] {
	const trimmed = [...lines];

	while (trimmed.length > 0 && trimmed[0] === "") {
		trimmed.shift();
	}

	trimTrailingBlankLines(trimmed);
	return trimmed;
}
