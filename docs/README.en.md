[简体中文](../README.md) | **English** | [繁體中文](README.zh-TW.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [ไทย](README.th.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md)

# Persona Tags

An enhanced Persona Management extension for SillyTavern.

When your persona list grows large, it quickly becomes hard to keep track of who is who. This extension lets you tag personas, filter by tags, manage in batches, and reorder freely so everything stays clean and easy to find.

## Features

### Tagging System
- Add tags to personas (comma-separated to add multiple at once)
- Expandable **Existing Tags** quick picker in the right column (automatically hides tags already on the current persona, with smooth scrolling when you have many tags)
- Filter personas by tags with both **Include** (show only matching) and **Exclude** (hide matching) modes
- Long-press tags in the filter panel to drag and reorder them
- Tags used by personas connected to the current character subtly glow
- Display tags directly on each persona card
- Add initial tags right inside the Create Persona dialog

### Batch Management
- Click **Batch** to enter batch mode with checkboxes on every card
- Select All / Clear selection
- Batch add tags, batch remove tags, and batch delete personas

### Sorting & Ordering
- Long-press persona cards to drag and reorder (mobile-friendly)
- Enter an exact position number in the right column to jump directly
- Displays the current position index on every card
- Independent sort orders for **All** personas and each individual character/group's connected personas

### Views & Navigation
- **Connected** view: show only personas linked to the current character/group
- **All** view: show all personas
- Top **↑ / ↓** quick jump scrolling: jump by a custom number of personas (default `10`, persisted across sessions); hold for `0.5s` to jump straight to the top or bottom
- Manual refresh button to reload the list
- Supports both list view and grid view

### Localization & More
- Full support for all **17 official SillyTavern UI languages**, automatically following your SillyTavern language setting (falls back to English for unsupported or future languages)
- Optional checkboxes to **Copy tags** and **Copy connections** when duplicating a persona
- Enhanced multi-persona selection popup showing avatar, name, and tags when multiple personas are linked to the same character
- Persona backup & restore automatically includes tags, custom sort orders, and quick-scroll settings

## Installation

### Method 1: Install inside SillyTavern (Recommended)

1. Open SillyTavern and click **Extensions** (the cubes icon in the top bar)
2. Click **Install extension**
3. Paste the repository URL below, install it, and refresh the page:

```
https://github.com/XiaoBai20001212/persona-tags
```

> Future updates can be installed directly from **Manage extensions**.

### Method 2: Manual Installation

Download and extract the repository, then place the entire `persona-tags` folder into:

```
SillyTavern/public/scripts/extensions/third-party/persona-tags/
```

Refresh the page and you are ready to go.

## Data Storage

Tag and sorting data are stored inside SillyTavern's `extension_settings` without modifying your original persona data. Removing the extension folder restores the default UI cleanly without affecting SillyTavern.

## Authors

- [小白](https://github.com/XiaoBai20001212)
- [好大一只鱼](https://github.com/haodayizhiyu404)
