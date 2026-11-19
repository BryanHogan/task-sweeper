# Task Sweeper

Obsidian plugin that moves completed tasks to a `## Done` section at the bottom of the note.

I keep my to-do lists inside my notes, but finished tasks pile up and get in the way. I don't want to delete them, it's nice to see what got done and when. So open tasks stay at the top, finished ones go to the bottom.

## Example

Before:

![Note with completed and open tasks mixed under several headings](assets/Task-Sweeper-Before.png)

After:

![Same note with open tasks under their headings and completed tasks, dated, under Done at the bottom](assets/Task-Sweeper-After.png)

In Markdown:

```markdown
## Groceries

- [ ] Oat milk
- [x] Coffee beans
- [ ] Bread
- [x] Rice
```

becomes:

```markdown
## Groceries

- [ ] Oat milk
- [ ] Bread

## Done

- [x] Coffee beans (2026-11-19)
- [x] Rice (2026-11-19)
```

Everything stays plain Markdown, so your notes work without the plugin.

## Lightweight

Each plugin adds complexity, risk and loading time, so I kept this one minimal.

- About 10 KB (4 KB gzipped), ~900 lines of TypeScript.
- No dependencies.
- Offline: no network requests, no telemetry.
- On load it only reads settings and registers commands. No vault scans, file watchers or timers.
- Only touches the current note.
- Auto sweep runs only when you check off a task, not on every keystroke.
- Works on desktop and mobile, Obsidian 1.4.0+.

## Features

- **Sweep completed tasks to bottom of note**: Command to sweep the current note.
- **Auto sweep**: Sweeps right after you check off a task. Turn it on in settings.
- **Scope**: Run everywhere, or only in selected files and folders.
- **Add current file to scope**: Command to add the current note to the selected files.

![Command palette showing both Task Sweeper commands](assets/Task-Sweeper-Commands.png)

## How it works

1. Finds completed top-level tasks, with everything indented beneath them (sub-tasks, notes, code).
2. Moves them under `## Done` at the bottom of the note.
3. Adds a completion date `(YYYY-MM-DD)` to each top-level task that doesn't have one.

Anything else you've written under `## Done` stays.

### Sub-tasks

- A completed parent moves with all its sub-tasks, finished or not.
- A completed sub-task under an open parent stays put.

## Settings

- **Auto sweep completed tasks**: On or off.
- **Active scope**: `Global` or `Selected files and folders`.
- **Selected files**: One vault-relative Markdown file path per line.
- **Selected folders**: One vault-relative folder path per line. Includes everything inside.

![Task Sweeper settings tab](assets/Task-Sweeper-Settings.png)

## Good to know

- The managed section is the last `## Done` heading with no `#` or `##` heading after it. A `## Done` followed by other sections is left alone and a new one gets created at the bottom.
- Tasks in fenced code blocks and frontmatter are never swept.
- Sweeps pause while a note has an unclosed fenced code block.
- Undo and redo never trigger auto sweep, so you can undo a sweep.

## Installation

### Community plugins

Once Task Sweeper is in the community catalog:

1. Open **Settings → Community plugins**.
2. Turn off restricted mode if needed.
3. Select **Browse**, search for **Task Sweeper**, then install and enable it.

### Manual

1. Download `manifest.json` and `main.js` from the latest release.
2. Put them in `<Vault>/.obsidian/plugins/task-sweeper/`.
3. Reload Obsidian and enable **Task Sweeper** under **Settings → Community plugins**.

## Development

Requires Node.js 22.13+ and npm.

```bash
npm install
npm run dev      # Watch build
npm run build    # Production build
npm run lint
npm test
```

## Releasing

1. Set the version and minimum Obsidian version in `manifest.json` and `versions.json`.
2. Run `npm run build`.
3. Create a GitHub release tagged with the exact version, no leading `v`.
4. Attach `manifest.json` and `main.js`.

## Feedback

Bugs or ideas: [open an issue](https://github.com/BryanHogan/task-sweeper/issues).

Made by [Bryan Hogan](https://bryanhogan.com).
