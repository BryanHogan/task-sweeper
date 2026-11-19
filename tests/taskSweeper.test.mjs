import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const bundle = await build({
	entryPoints: [fileURLToPath(new URL("../src/taskSweeper.ts", import.meta.url))],
	bundle: true,
	format: "esm",
	platform: "node",
	write: false,
});
const { sweepCompletedTasks } = await import(
	`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString("base64")}`
);

test("leaves notes with an unclosed code fence untouched", () => {
	const notes = [
		"- [x] Finished task\n\n```text\nunfinished example",
		"- [x] Finished task\r\n\r\n## Done\r\n\r\n~~~text\r\n```\r\n- [x] Example\r\n",
	];
	for (const note of notes) {
		const result = sweepCompletedTasks(note);
		assert.equal(result.content, note);
		assert.equal(result.didChange, false);
		assert.equal(result.movedCount, 0);
		assert.equal(result.skippedReason, "unclosed-code-fence");
	}
});

test("sweeps a completed task and its subtasks past a closed code fence", () => {
	const note = "- [x] Finished task (2026-11-19)\n  - [ ] Subtask\n\n```text\n- [x] Example\n```\n";
	const result = sweepCompletedTasks(note);
	assert.equal(result.movedCount, 1);
	assert.equal(result.skippedReason, undefined);
	assert.equal(result.content, "```text\n- [x] Example\n```\n\n## Done\n\n- [x] Finished task (2026-11-19)\n  - [ ] Subtask\n");
});

test("recognizes a line of inline backticks as ordinary note content", () => {
	const note = "- [x] Finished task (2026-11-19)\n\n```inline code```\n";
	const result = sweepCompletedTasks(note);
	assert.equal(result.movedCount, 1);
	assert.equal(result.content, "```inline code```\n\n## Done\n\n- [x] Finished task (2026-11-19)\n");
});
