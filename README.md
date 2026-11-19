# Task Sweeper

Task Sweeper is an Obsidian plugin that moves completed top-level tasks to a managed `## Done` section at the bottom of the current note.

It is designed for people who want active tasks to stay visible while completed items are collected in one predictable place.

## Features

- Manual sweep command: Run **Sweep completed tasks to bottom of note** from the command palette to move completed top-level tasks into the note's `## Done` section.
- Auto sweep: Enable **Auto sweep completed tasks** in plugin settings to move completed top-level tasks shortly after you mark them done.
- Selective scope: Run the plugin everywhere or only in specific files and folders.
- Quick file inclusion: Run **Add current file to scope** to add the active note to the selective scope list.

## How it works

When Task Sweeper runs, it:

1. Finds completed top-level Markdown tasks in the current note, together with everything indented beneath them (sub-tasks, notes, code).
2. Removes each task block from its current position.
3. Appends them under a managed `## Done` heading at the bottom of the note.
4. Preserves any non-task content already inside that managed section.

Completed tasks moved into `## Done` are annotated with a completion date in `YYYY-MM-DD` format if they do not already have one. The date is added to the top-level task only; sub-task lines are left unchanged.

### Sub-tasks

- A completed top-level task moves as a block with all of its indented lines, including unfinished sub-tasks. Checking the parent marks the whole block as done.
- A completed sub-task under an unfinished parent stays where it is, so it keeps its context.

## Settings

Task Sweeper adds a settings tab with these options:

- **Auto sweep completed tasks**: Automatically sweep completed top-level tasks after you mark them done.
- **Active scope**: Choose between `Global` and `Selected files and folders`.
- **Selected files**: One vault-relative Markdown file path per line.
- **Selected folders**: One vault-relative folder path per line.

In selective mode, a note is active when it is listed directly in **Selected files** or is inside one of the listed **Selected folders**.

## Commands

- **Sweep completed tasks to bottom of note**
- **Add current file to scope**

## Notes and limitations

- Only top-level completed tasks such as `- [x] Done item` trigger a sweep. Completed sub-tasks under an unfinished parent are not moved on their own.
- Swept tasks are grouped under a managed `## Done` section at the bottom of the note.
- Existing completed task blocks already inside that managed section are preserved and kept there.
- The managed section is the last `## Done` heading in the note that has no other `#` or `##` heading after it. A `## Done` heading followed by other sections is treated as your own content and left in place; a new managed section is created at the bottom instead.
- Tasks inside fenced code blocks and YAML frontmatter are never swept.
- Sweeps pause when a note has an unclosed fenced code block.
- Undo and redo never trigger an auto sweep, so you can undo a sweep without it being reapplied.

## Installation

### Community plugins

After Task Sweeper is published to the Obsidian community plugin catalog:

1. Open **Settings → Community plugins**.
2. Disable safe mode if needed.
3. Browse for **Task Sweeper**.
4. Install the plugin and enable it.

### Manual installation

1. Download the latest release assets: `manifest.json` and `main.js`.
2. Create this folder inside your vault:

```text
<Vault>/.obsidian/plugins/task-sweeper/
```

3. Place `manifest.json` and `main.js` in that folder.
4. Reload Obsidian.
5. Enable **Task Sweeper** under **Settings → Community plugins**.

`styles.css` is not currently shipped because this plugin does not include custom styles.

## Development

Requirements:

- Node.js 22.13 or newer
- npm

Install dependencies:

```bash
npm install
```

Start the development build in watch mode:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Releasing

For each release:

1. Update `manifest.json` with the target version and minimum supported Obsidian version.
2. Update `versions.json` so the plugin version maps to the same minimum supported Obsidian version.
3. Build the plugin with `npm run build`.
4. Create a GitHub release whose tag exactly matches the plugin version, with no leading `v`.
5. Upload `manifest.json` and `main.js` as release assets.

## Support

- Repository: https://github.com/BryanHogan/task-sweeper
- Issues: https://github.com/BryanHogan/task-sweeper/issues
- Author: https://bryanhogan.com
