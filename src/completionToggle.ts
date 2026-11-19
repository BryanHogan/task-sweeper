import type { ChangeSet, Text } from "@codemirror/state";
import { isCompletionToggle } from "./taskSweeper";

/**
 * Checks only the lines an edit touched. A changed range counts when it spans
 * the same number of lines before and after (e.g. a checkbox click) and one of
 * those lines went from `- [ ]` to `- [x]`. Line insertions or deletions that
 * merely shift tasks around never match.
 */
export function hasCompletionToggle(
	changes: ChangeSet,
	oldDoc: Text,
	newDoc: Text,
): boolean {
	let found = false;

	changes.iterChangedRanges((fromA, toA, fromB, toB) => {
		if (found) {
			return;
		}

		const oldFirst = oldDoc.lineAt(fromA).number;
		const oldLast = oldDoc.lineAt(toA).number;
		const newFirst = newDoc.lineAt(fromB).number;
		const newLast = newDoc.lineAt(toB).number;
		if (oldLast - oldFirst !== newLast - newFirst) {
			return;
		}

		for (let offset = 0; offset <= oldLast - oldFirst; offset += 1) {
			if (isCompletionToggle(
				oldDoc.line(oldFirst + offset).text,
				newDoc.line(newFirst + offset).text,
			)) {
				found = true;
				return;
			}
		}
	});

	return found;
}
