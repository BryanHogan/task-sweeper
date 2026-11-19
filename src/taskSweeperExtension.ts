import { Annotation, type Text } from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { editorInfoField, type MarkdownFileInfo } from "obsidian";
import type TaskSweeperPlugin from "./main";
import {
	BLOCK_ID_TRAILING_PATTERN,
	COMPLETION_DATE_TRAILING_PATTERN,
	sweepCompletedTasks,
} from "./taskSweeper";
import { hasCompletionToggle } from "./completionToggle";

const TASK_SWEEPER_AUTO_ANNOTATION = Annotation.define<boolean>();

export function createTaskSweeperExtension(plugin: TaskSweeperPlugin) {
	return ViewPlugin.fromClass(
		class {
			private pendingSweepId: number | null = null;

			constructor(private readonly view: EditorView) {}

			update(update: ViewUpdate): void {
				if (!update.docChanged || !plugin.settings.autoSweepEnabled) {
					return;
				}

				if (!this.isCurrentFileActive()) {
					this.clearPendingSweep();
					return;
				}

				if (update.transactions.some((transaction) =>
					transaction.annotation(TASK_SWEEPER_AUTO_ANNOTATION),
				)) {
					return;
				}

				// Undo/redo must never trigger a sweep, or undoing a sweep re-sweeps.
				if (update.transactions.some((transaction) =>
					transaction.isUserEvent("undo") || transaction.isUserEvent("redo"),
				)) {
					this.clearPendingSweep();
					return;
				}

				if (hasCompletionToggle(
					update.changes,
					update.startState.doc,
					update.state.doc,
				)) {
					this.scheduleSweep();
				}
			}

			destroy(): void {
				this.clearPendingSweep();
			}

			private scheduleSweep(): void {
				this.clearPendingSweep();
				this.pendingSweepId = window.setTimeout(() => {
					this.pendingSweepId = null;
					this.applySweep();
				}, 80);
			}

			private applySweep(): void {
				if (!plugin.settings.autoSweepEnabled || !this.isCurrentFileActive()) {
					return;
				}

				const result = sweepCompletedTasks(this.view.state.doc.toString());
				if (!result.didChange) {
					return;
				}

				const oldDoc = this.view.state.doc;
				const head = this.view.state.selection.main.head;
				const oldLine = oldDoc.lineAt(head);
				const cursorLineText = oldLine.text;
				const cursorColInLine = head - oldLine.from;

				this.view.dispatch({
					changes: {
						from: 0,
						to: oldDoc.length,
						insert: result.content,
					},
					annotations: TASK_SWEEPER_AUTO_ANNOTATION.of(true),
				});

				const newDoc = this.view.state.doc;
				const restoredLineFrom = locateLineInDoc(newDoc, cursorLineText);
				const nextHead =
					restoredLineFrom !== null
						? Math.min(
								restoredLineFrom + cursorColInLine,
								newDoc.lineAt(restoredLineFrom).to,
							)
						: Math.min(head, newDoc.length);

				this.view.dispatch({
					selection: { anchor: nextHead },
					annotations: TASK_SWEEPER_AUTO_ANNOTATION.of(true),
				});
			}

			private getFileInfo(): MarkdownFileInfo | null {
				try {
					return this.view.state.field(editorInfoField);
				} catch {
					return null;
				}
			}

			private isCurrentFileActive(): boolean {
				const file = this.getFileInfo()?.file;
				return !!file && plugin.isFileActive(file);
			}

			private clearPendingSweep(): void {
				if (this.pendingSweepId === null) {
					return;
				}

				window.clearTimeout(this.pendingSweepId);
				this.pendingSweepId = null;
			}
		},
	);
}

function locateLineInDoc(doc: Text, lineText: string): number | null {
	const target = lineSignature(lineText);
	if (target.length === 0) {
		return null;
	}

	let match: number | null = null;
	for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber += 1) {
		const line = doc.line(lineNumber);
		if (lineSignature(line.text) !== target) {
			continue;
		}

		if (match !== null) {
			return null;
		}

		match = line.from;
	}

	return match;
}

function lineSignature(text: string): string {
	let result = text.trimEnd();

	const blockIdMatch = result.match(BLOCK_ID_TRAILING_PATTERN);
	if (blockIdMatch) {
		result = result.slice(0, -blockIdMatch[0].length);
	}

	const dateMatch = result.match(COMPLETION_DATE_TRAILING_PATTERN);
	if (dateMatch) {
		result = result.slice(0, -dateMatch[0].length);
	}

	return result;
}
