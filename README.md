# Task Sweeper

Task Sweeper is a small Obsidian plugin that moves your completed tasks to a `## Done` section at the bottom of the note.

I like keeping my to-do lists right inside my notes, but after a while the finished tasks pile up and get in the way of the ones I still need to do. I didn't want to delete them either, it's nice to see what got done and when. So this plugin does one simple thing: open tasks stay at the top, finished ones get collected in one predictable place at the bottom.

<!-- Screenshot: hero.png — a real note in Obsidian (reading or live preview, default theme) with a few open tasks at the top and a ## Done section with dated tasks at the bottom -->

## What it looks like

Before:

```markdown
## Groceries

- [ ] Oat milk
- [x] Coffee beans
- [ ] Bread
- [x] Rice
```

After a sweep:

```markdown
## Groceries

- [ ] Oat milk
- [ ] Bread

## Done

- [x] Coffee beans (2026-11-19)
- [x] Rice (2026-11-19)
```

That's it. Everything stays plain Markdown, so your notes still work fine if you ever turn the plugin off.

<!-- Screenshot: auto-sweep.gif — short GIF of checking off a task in a real note and watching it move into ## Done -->

## Small and lightweight

I try to use as few plugins as possible, since each one adds complexity, risk and loading time. So I wanted Task Sweeper to be something I'd be okay installing myself.

- **Small**: The whole plugin is about 10 KB (around 4 KB gzipped), built from roughly 900 lines of TypeScript.
- **No dependencies**: Nothing extra gets bundled in, it only uses what Obsidian already provides.
- **Fully offline**: No network requests, no telemetry, no accounts.
- **Light on startup**: On load it only reads its settings and registers its commands. No vault scans, no file watchers, no background timers.
- **Only touches the note you're in**: A sweep reads and rewrites the current note, nothing else in your vault.
- **Doesn't run on every keystroke**: Auto sweep only kicks in when you actually check off a task, then runs once a moment later.
- **Works on mobile**: Desktop, iOS and Android, Obsidian 1.4.0 or newer.

## What it does

- **Manual sweep**: Run **Sweep completed tasks to bottom of note** from the command palette whenever you want to clean up a note.
- **Auto sweep**: Turn on **Auto sweep completed tasks** in the settings and tasks get moved shortly after you check them off.
- **Choose where it runs**: Use it everywhere in your vault, or only in specific files and folders.
- **Quickly add a note**: Run **Add current file to scope** to add the note you're in to that list.

When it runs, Task Sweeper:

1. Finds completed top-level tasks in the current note, together with everything indented beneath them (sub-tasks, notes, code).
2. Removes each of those task blocks from where they are.
3. Adds them under a managed `## Done` heading at the bottom of the note.
4. Keeps anything else you've already written inside that section.

Each swept task gets a completion date in `YYYY-MM-DD` format, unless it already has one. The date only goes on the top-level task, sub-task lines are left as they are.

### Sub-tasks

- If you check off a top-level task, it moves together with all of its indented lines, including unfinished sub-tasks. Checking the parent means the whole thing is done.
- If you check off a sub-task but its parent is still open, it stays where it is so it keeps its context.

## Settings

<!-- Screenshot: settings.png — the Task Sweeper settings tab with Active scope set to "Selected files and folders" and an example path or two filled in -->

- **Auto sweep completed tasks**: Automatically sweep completed top-level tasks after you mark them done.
- **Active scope**: Choose between `Global` and `Selected files and folders`.
- **Selected files**: One vault-relative Markdown file path per line.
- **Selected folders**: One vault-relative folder path per line.

In selective mode, a note is active when it's listed in **Selected files** or sits inside one of the **Selected folders**.

## Commands

- **Sweep completed tasks to bottom of note**
- **Add current file to scope**

<!-- Screenshot: command-palette.png — command palette filtered to "Task Sweeper" showing both commands -->

## Good to know

- Only top-level completed tasks like `- [x] Done item` trigger a sweep. Completed sub-tasks under an open parent aren't moved on their own.
- Completed tasks already inside the managed `## Done` section stay there.
- The managed section is the last `## Done` heading in the note with no other `#` or `##` heading after it. If you have your own `## Done` heading with other sections below it, it's treated as your content and left alone, a new managed section gets created at the bottom instead.
- Tasks inside fenced code blocks and YAML frontmatter are never swept.
- If a note has an unclosed fenced code block, sweeps pause. I'd rather not touch a note that can't be read safely.
- Undo and redo never trigger an auto sweep, so you can undo a sweep without it happening again right away.

## Installation

### Community plugins

Once Task Sweeper is in the Obsidian community plugin catalog:

1. Open **Settings → Community plugins**.
2. Turn off restricted mode if needed.
3. Select **Browse** and search for **Task Sweeper**.
4. Install and enable it.

### Manual installation

1. Download `manifest.json` and `main.js` from the latest release.
2. Create this folder inside your vault:

```text
<Vault>/.obsidian/plugins/task-sweeper/
```

3. Put `manifest.json` and `main.js` in that folder.
4. Reload Obsidian.
5. Enable **Task Sweeper** under **Settings → Community plugins**.

There's no `styles.css`, the plugin doesn't need any custom styles.

## Development

You'll need Node.js 22.13 or newer and npm.

```bash
npm install      # Install dependencies
npm run dev      # Development build in watch mode
npm run build    # Production build
npm run lint     # Lint checks
npm test         # Run tests
```

## Releasing

1. Update `manifest.json` with the new version and minimum supported Obsidian version.
2. Update `versions.json` so the new version maps to that same minimum Obsidian version.
3. Build with `npm run build`.
4. Create a GitHub release with a tag that exactly matches the version, no leading `v`.
5. Upload `manifest.json` and `main.js` as release assets.

## Feedback

If something doesn't work the way you'd expect, or you have an idea, feel free to open an issue. I'm happy to hear how you use it.

- Repository: https://github.com/BryanHogan/task-sweeper
- Issues: https://github.com/BryanHogan/task-sweeper/issues
- Me: https://bryanhogan.com
