export type TaskSweeperScopeMode = "global" | "selective";

export interface TaskSweeperScopeSettings {
	scopeMode: TaskSweeperScopeMode;
	includedFiles: string[];
	includedFolders: string[];
}

export function normalizeScopeSettings<T extends TaskSweeperScopeSettings>(
	settings: T,
): T {
	return {
		...settings,
		scopeMode: settings.scopeMode === "selective" ? "selective" : "global",
		includedFiles: normalizeUniquePaths(settings.includedFiles, "file"),
		includedFolders: normalizeUniquePaths(settings.includedFolders, "folder"),
	};
}

export function isFileInScope(
	filePath: string,
	settings: TaskSweeperScopeSettings,
): boolean {
	if (settings.scopeMode === "global") {
		return true;
	}

	const normalizedFilePath = normalizePath(filePath, "file");
	if (!normalizedFilePath) {
		return false;
	}

	if (settings.includedFiles.includes(normalizedFilePath)) {
		return true;
	}

	return settings.includedFolders.some((folderPath) =>
		normalizedFilePath.startsWith(`${folderPath}/`),
	);
}

export function addIncludedFile<T extends TaskSweeperScopeSettings>(
	settings: T,
	filePath: string,
): { nextSettings: T; added: boolean } {
	const normalizedFilePath = normalizePath(filePath, "file");
	if (!normalizedFilePath) {
		return {
			nextSettings: settings,
			added: false,
		};
	}

	if (
		settings.includedFiles.includes(normalizedFilePath) ||
		settings.includedFolders.some((folderPath) =>
			normalizedFilePath.startsWith(`${folderPath}/`),
		)
	) {
		return {
			nextSettings: settings,
			added: false,
		};
	}

	return {
		nextSettings: {
			...settings,
			includedFiles: [...settings.includedFiles, normalizedFilePath],
		},
		added: true,
	};
}

export function serializePathList(paths: string[]): string {
	return paths.join("\n");
}

export function parsePathList(
	value: string,
	kind: "file" | "folder",
): string[] {
	return normalizeUniquePaths(value.split(/\r?\n/), kind);
}

function normalizeUniquePaths(
	paths: string[] | undefined,
	kind: "file" | "folder",
): string[] {
	if (!paths) {
		return [];
	}

	const normalizedPaths = paths
		.map((path) => normalizePath(path, kind))
		.filter((path): path is string => path !== null);

	return Array.from(new Set(normalizedPaths));
}

function normalizePath(
	path: string,
	kind: "file" | "folder",
): string | null {
	const trimmed = path.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
	if (!trimmed) {
		return null;
	}

	if (kind === "folder") {
		return trimmed;
	}

	return trimmed;
}
