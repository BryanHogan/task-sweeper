import { App, PluginSettingTab, Setting } from "obsidian";
import TaskSweeperPlugin from "./main";
import {
	type TaskSweeperScopeMode,
	normalizeScopeSettings,
	parsePathList,
	serializePathList,
} from "./scope";

export interface TaskSweeperSettings {
	autoSweepEnabled: boolean;
	scopeMode: TaskSweeperScopeMode;
	includedFiles: string[];
	includedFolders: string[];
}

export const DEFAULT_SETTINGS: TaskSweeperSettings = {
	autoSweepEnabled: false,
	scopeMode: "global",
	includedFiles: [],
	includedFolders: [],
};

export class TaskSweeperSettingTab extends PluginSettingTab {
	plugin: TaskSweeperPlugin;

	constructor(app: App, plugin: TaskSweeperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const settings = normalizeScopeSettings(this.plugin.settings);

		new Setting(containerEl)
			.setName("Auto sweep completed tasks")
			.setDesc(
				"Move completed top-level tasks shortly after they are marked done in the active note.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.autoSweepEnabled)
					.onChange(async (value) => {
						this.plugin.settings.autoSweepEnabled = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Active scope")
			.setDesc(
				"Choose whether the plugin runs in every note or only in selected notes and folders.",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("global", "Global")
					.addOption("selective", "Selected files and folders")
					.setValue(settings.scopeMode)
					.onChange(async (value: TaskSweeperScopeMode) => {
						this.plugin.settings.scopeMode = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		new Setting(containerEl)
			.setName("Selected files")
			.setDesc(
				"One vault-relative Markdown file path per line. Used only when the active scope is selective.",
			)
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("projects/todo.md")
					.setValue(serializePathList(settings.includedFiles))
					.onChange(async (value) => {
						this.plugin.settings.includedFiles = parsePathList(value, "file");
						await this.plugin.saveSettings();
					});

				textArea.inputEl.rows = 6;
				textArea.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName("Selected folders")
			.setDesc(
				"One vault-relative folder path per line. Notes inside these folders are always active in selective mode.",
			)
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("Enter a folder path")
					.setValue(serializePathList(settings.includedFolders))
					.onChange(async (value) => {
						this.plugin.settings.includedFolders = parsePathList(value, "folder");
						await this.plugin.saveSettings();
					});

				textArea.inputEl.rows = 6;
				textArea.inputEl.cols = 40;
			});
	}
}
