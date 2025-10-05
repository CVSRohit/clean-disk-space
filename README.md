# 🧹 clean-disk-space

A safe and interactive CLI tool to clean up disk space on macOS.

## Features

✅ **Safe by default** - Only removes caches and temporary files
✅ **Interactive** - Asks for confirmation before destructive operations
✅ **Dry-run mode** - Preview what will be cleaned
✅ **Space tracking** - Shows exactly how much space was freed
✅ **Color-coded output** - Easy to read progress and results
✅ **Smart detection** - Only cleans what's installed on your system
✅ **Two modes** - Standard (safe) and Deep (aggressive) cleanup

## Installation

### Global Installation (Recommended)

```bash
npm install -g clean-disk-space
```

### Run Without Installing

```bash
npx clean-disk-space
```

## Usage

### View Help

```bash
clean-disk-space help
```

### View Documentation

```bash
clean-disk-space docs
```

### Standard Cleanup (Safe)

```bash
# Preview what will be cleaned
clean-disk-space --dry-run

# Run interactive cleanup
clean-disk-space

# Auto-confirm all prompts
clean-disk-space --yes
```

### Deep Cleanup (Aggressive)

```bash
# Preview deep cleanup
clean-disk-space deep --dry-run

# Run deep cleanup with confirmations
clean-disk-space deep

# Auto-confirm (use with caution!)
clean-disk-space deep --yes
```

## What It Cleans

### Standard Cleanup (Safe)
- 🗑️ Trash
- 🍺 Homebrew cache
- 🗄️ User caches (Safari, Chrome, VS Code, etc.)
- 📦 npm cache
- 🧶 Yarn cache
- 📝 Old log files (>30 days)
- 📱 Xcode DerivedData (with confirmation)
- 🔍 Finds large files for manual review

### Deep Cleanup (Requires Confirmation)
- 📂 node_modules folders (shows list before deletion)
- 🐳 Docker images and containers
- 💎 CocoaPods cache
- 🤖 Gradle cache
- 📦 Xcode Archives

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Preview changes without executing |
| `--yes` | `-y` | Auto-confirm all prompts |
| `--verbose` | `-v` | Show detailed output |
| `--help` | `-h` | Show help message |

## Examples

```bash
# Quick monthly cleanup
clean-disk-space --yes

# When low on disk space
clean-disk-space --dry-run
clean-disk-space
clean-disk-space deep --dry-run
clean-disk-space deep

# Check what would be freed
clean-disk-space deep --dry-run
```

## How Much Space Can I Free?

Typical space savings:
- 🗑️ Trash: 0-5GB
- 🍺 Homebrew: 0.5-2GB
- 🗄️ Caches: 1-5GB
- 📱 Xcode: 5-20GB (if you have Xcode)
- 📂 node_modules: 5-50GB (if you're a developer)
- 🐳 Docker: 1-10GB (if you use Docker)

**Standard cleanup**: Usually 2-10GB
**Deep cleanup**: Usually 10-50GB+ for developers

## Safety Features

### What's Safe to Delete
- Application caches
- Homebrew downloads
- npm/Yarn cache
- Old log files (>30 days old)
- Trash
- Docker unused images
- Xcode DerivedData (rebuilds automatically)

### What Requires Confirmation
- node_modules (shows full list first)
- Xcode Archives (may contain important builds)
- Docker cleanup (may remove needed images)
- CocoaPods cache
- Gradle cache

### What's Never Deleted
- System files
- Applications
- User documents
- Active project files
- Recent logs

## Requirements

- macOS
- Node.js >= 12.0.0
- Terminal/Shell access

## Best Practices

1. ✅ Always run with `--dry-run` first
2. ✅ Review what will be deleted
3. ✅ Start with standard cleanup
4. ✅ Only use deep cleanup when desperate for space
5. ✅ Keep backups of important data
6. ✅ Run standard cleanup monthly

## Uninstallation

```bash
npm uninstall -g clean-disk-space
```

## License

MIT License - feel free to use and modify!

## Support

If you encounter any issues, please check the documentation first:

```bash
clean-disk-space docs
```

---

**Note**: Always have backups of important data before running cleanup tools!
