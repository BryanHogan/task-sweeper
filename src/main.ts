import { Notice, Plugin, TFile, type Editor, type MarkdownFileInfo } from "obsidian";
import {
	DEFAULT_SETTINGS,
	TaskSweeperSettingTab,
	type TaskSweeperSettings,
} from "./settings";
import {
	addIncludedFile,
	isFileInScope,
	normalizeScopeSettings,
} from "./scope";
import { createTaskSweeperExtension } from "./taskSweeperExtension";
import { sweepCompletedTasks } from "./taskSweeper";

export default class TaskSweeperPlugin extends Plugin {
	settings: TaskSweeperSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addCommand({
			id: "sweep-completed-tasks",
			name: "Sweep completed tasks to bottom of note",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				info: MarkdownFileInfo,
			) => {
				const file = info.file;
				if (!(file instanceof TFile)) {
					return false;
				}

				if (!checking) {
					this.sweepEditor(editor, file, "command");
				}

				return true;
			},
		});

		this.addCommand({
			id: "add-current-file-to-scope",
			name: "Add current file to scope",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!(file instanceof TFile) || file.extension !== "md") {
					return false;
				}

				if (!checking) {
					void this.addCurrentFileToScope(file);
				}

				return true;
			},
		});

		this.addSettingTab(new TaskSweeperSettingTab(this.app, this));
		this.registerEditorExtension(createTaskSweeperExtension(this));
	}

	async loadSettings(): Promise<void> {
		const loadedSettings = await this.loadData() as
			| (Partial<TaskSweeperSettings> & { autoSweepOnSave?: boolean })
			| null;

		this.settings = normalizeScopeSettings(
			Object.assign(
				{},
				DEFAULT_SETTINGS,
				loadedSettings,
				loadedSettings?.autoSweepEnabled === undefined &&
					loadedSettings?.autoSweepOnSave !== undefined
					? { autoSweepEnabled: loadedSettings.autoSweepOnSave }
					: {},
			),
		);
	}

	async saveSettings(): Promise<void> {
		this.settings = normalizeScopeSettings(this.settings);
		await this.saveData(this.settings);
	}

	isFileActive(file: TFile): boolean {
		return isFileInScope(file.path, this.settings);
	}

	private sweepEditor(
		editor: Editor,
		file: TFile,
		trigger: "command" | "auto",
	): boolean {
		if (!this.isFileActive(file)) {
			if (trigger === "command") {
				new Notice("This note is outside the active scope.");
			}
			return false;
		}

		const currentContent = editor.getValue();
		const result = sweepCompletedTasks(currentContent);
		if (!result.didChange) {
			if (trigger === "command") {
				if (result.skippedReason === "unclosed-code-fence") {
					new Notice("Close the code block before sweeping tasks.");
				} else if (result.totalCompletedCount > 0) {
					new Notice("Completed tasks are already at the bottom of the note.");
				} else {
					new Notice("No completed top-level tasks found.");
				}
			}
			return false;
		}

		const from = { line: 0, ch: 0 };
		const to = {
			line: editor.lastLine(),
			ch: editor.getLine(editor.lastLine()).length,
		};
		editor.replaceRange(result.content, from, to, "task-sweeper");

		if (trigger === "command") {
			if (result.movedCount === 0) {
				new Notice("Updated completed tasks in the Done section.");
			} else {
				const taskLabel = result.movedCount === 1 ? "task" : "tasks";
				new Notice(
					`Moved ${result.movedCount} completed ${taskLabel} to the bottom of the note.`,
				);
			}
		}

		return true;
	}

	private async addCurrentFileToScope(file: TFile): Promise<void> {
		const { nextSettings, added } = addIncludedFile(this.settings, file.path);
		if (!added) {
			if (this.isFileActive(file)) {
				new Notice("This note is already in the active scope.");
			} else {
				new Notice("This note could not be added to the active scope.");
			}
			return;
		}

		this.settings = nextSettings;
		await this.saveSettings();

		const suffix =
			this.settings.scopeMode === "global"
				? " Scope is still global."
				: "";
		new Notice(`Added this note to the active scope.${suffix}`);
	}
}
