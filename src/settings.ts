import {
	App,
	PluginSettingTab,
	Setting,
	type SettingDefinitionItem,
} from "obsidian";
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

const AUTO_SWEEP_NAME = "Auto sweep completed tasks";
const AUTO_SWEEP_DESC =
	"Move completed top-level tasks shortly after they are marked done in the active note.";
const SCOPE_MODE_NAME = "Active scope";
const SCOPE_MODE_DESC =
	"Choose whether the plugin runs in every note or only in selected notes and folders.";
const SCOPE_MODE_OPTIONS: Record<TaskSweeperScopeMode, string> = {
	global: "Global",
	selective: "Selected files and folders",
};
const INCLUDED_FILES_NAME = "Selected files";
const INCLUDED_FILES_DESC =
	"One vault-relative Markdown file path per line. Used only when the active scope is selective.";
const INCLUDED_FILES_PLACEHOLDER = "projects/todo.md";
const INCLUDED_FOLDERS_NAME = "Selected folders";
const INCLUDED_FOLDERS_DESC =
	"One vault-relative folder path per line. Notes inside these folders are always active in selective mode.";
const INCLUDED_FOLDERS_PLACEHOLDER = "Enter a folder path";

export class TaskSweeperSettingTab extends PluginSettingTab {
	plugin: TaskSweeperPlugin;

	constructor(app: App, plugin: TaskSweeperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: AUTO_SWEEP_NAME,
				desc: AUTO_SWEEP_DESC,
				control: { type: "toggle", key: "autoSweepEnabled" },
			},
			{
				name: SCOPE_MODE_NAME,
				desc: SCOPE_MODE_DESC,
				control: {
					type: "dropdown",
					key: "scopeMode",
					options: SCOPE_MODE_OPTIONS,
				},
			},
			{
				name: INCLUDED_FILES_NAME,
				desc: INCLUDED_FILES_DESC,
				control: {
					type: "textarea",
					key: "includedFiles",
					placeholder: INCLUDED_FILES_PLACEHOLDER,
					rows: 6,
				},
			},
			{
				name: INCLUDED_FOLDERS_NAME,
				desc: INCLUDED_FOLDERS_DESC,
				control: {
					type: "textarea",
					key: "includedFolders",
					placeholder: INCLUDED_FOLDERS_PLACEHOLDER,
					rows: 6,
				},
			},
		];
	}

	getControlValue(key: string): unknown {
		const settings = this.plugin.settings;
		switch (key) {
			case "autoSweepEnabled":
				return settings.autoSweepEnabled;
			case "scopeMode":
				return settings.scopeMode;
			case "includedFiles":
				return serializePathList(settings.includedFiles);
			case "includedFolders":
				return serializePathList(settings.includedFolders);
			default:
				return undefined;
		}
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const settings = this.plugin.settings;
		switch (key) {
			case "autoSweepEnabled":
				if (typeof value !== "boolean") return;
				settings.autoSweepEnabled = value;
				break;
			case "scopeMode":
				if (value !== "global" && value !== "selective") return;
				settings.scopeMode = value;
				break;
			case "includedFiles":
				if (typeof value !== "string") return;
				settings.includedFiles = parsePathList(value, "file");
				break;
			case "includedFolders":
				if (typeof value !== "string") return;
				settings.includedFolders = parsePathList(value, "folder");
				break;
			default:
				return;
		}
		await this.plugin.saveSettings();
	}

	/**
	 * Imperative fallback for Obsidian versions before 1.13.0, which don't
	 * support getSettingDefinitions(). Newer versions never call this.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const settings = normalizeScopeSettings(this.plugin.settings);

		new Setting(containerEl)
			.setName(AUTO_SWEEP_NAME)
			.setDesc(AUTO_SWEEP_DESC)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.autoSweepEnabled)
					.onChange(async (value) => {
						this.plugin.settings.autoSweepEnabled = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(SCOPE_MODE_NAME)
			.setDesc(SCOPE_MODE_DESC)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(SCOPE_MODE_OPTIONS)
					.setValue(settings.scopeMode)
					.onChange(async (value: TaskSweeperScopeMode) => {
						this.plugin.settings.scopeMode = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(INCLUDED_FILES_NAME)
			.setDesc(INCLUDED_FILES_DESC)
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder(INCLUDED_FILES_PLACEHOLDER)
					.setValue(serializePathList(settings.includedFiles))
					.onChange(async (value) => {
						this.plugin.settings.includedFiles = parsePathList(value, "file");
						await this.plugin.saveSettings();
					});

				textArea.inputEl.rows = 6;
				textArea.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName(INCLUDED_FOLDERS_NAME)
			.setDesc(INCLUDED_FOLDERS_DESC)
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder(INCLUDED_FOLDERS_PLACEHOLDER)
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
