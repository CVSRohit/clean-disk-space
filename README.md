# 🧹 clean-disk-space

[![npm version](https://img.shields.io/npm/v/clean-disk-space.svg)](https://www.npmjs.com/package/clean-disk-space)
[![npm downloads](https://img.shields.io/npm/dm/clean-disk-space.svg)](https://www.npmjs.com/package/clean-disk-space)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/clean-disk-space.svg)](https://nodejs.org)

> **The first comprehensive macOS cleanup tool available as an npm package!** 🚀
>
> No Homebrew required. No Python dependencies. Just `npx clean-disk-space` and go.

Clean up **gigabytes** of unnecessary files with confidence. Features **space tracking**, **dry-run mode**, and **two cleanup levels** (safe & aggressive).

```bash
# Install globally
npm install -g clean-disk-space

# Or use instantly with npx (no installation needed!)
npx clean-disk-space
```

---

## 🎯 Why clean-disk-space?

Unlike other macOS cleanup tools, **clean-disk-space** is:

### ✅ npm-Native
- **No Homebrew needed** (unlike `mac-cleanup`)
- **No Python required** (unlike `mac-cleanup-py`)
- Works instantly with `npx` - zero setup!

### ✅ Comprehensive
- **System-wide cleanup** (not just node_modules like `npkill`)
- Cleans Homebrew, Docker, Xcode, caches, logs, and more
- All in one command

### ✅ Developer-Friendly
- Built for the Node.js ecosystem
- Zero external dependencies
- Interactive confirmations for safety
- Tracks exactly how much space you freed

### ✅ Safe by Default
- Preview mode with `--dry-run`
- Shows what will be deleted before deletion
- No sudo required
- Never touches system files

---

## 📊 Comparison with Alternatives

| Feature | clean-disk-space | mac-cleanup | mac-cleanup-py | npkill |
|---------|------------------|-------------|----------------|--------|
| **Installation** | npm/npx | Homebrew | pip | npm |
| **External Dependencies** | ✅ None | ❌ Homebrew | ❌ Python | ✅ None |
| **System-wide Cleanup** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **node_modules Cleanup** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Docker Cleanup** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Xcode Cleanup** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Space Tracking** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Dry-run Preview** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Built-in Docs** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Works with npx** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |

**clean-disk-space is the only npm-native, comprehensive macOS cleanup tool!**

---

## ✨ Features

<table>
<tr>
<td width="33%">

### 🛡️ Safety First
- **Dry-run mode** to preview
- **Interactive confirmations**
- **Color-coded warnings**
- **No system files touched**

</td>
<td width="33%">

### 📊 Smart Tracking
- **Before/after sizes**
- **Total space freed**
- **Detailed breakdowns**
- **Progress indicators**

</td>
<td width="33%">

### 💪 Powerful
- **Standard + Deep modes**
- **Built-in documentation**
- **Zero dependencies**
- **Lightning fast**

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g clean-disk-space

# Or use without installing
npx clean-disk-space
```

### Basic Usage

```bash
# Preview what will be cleaned (recommended first run)
clean-disk-space --dry-run

# Run interactive cleanup
clean-disk-space

# Auto-confirm all safe operations
clean-disk-space --yes
```

### Advanced Usage

```bash
# Deep cleanup (node_modules, Docker, etc.) - with confirmations
clean-disk-space deep

# Preview deep cleanup
clean-disk-space deep --dry-run

# View full documentation
clean-disk-space docs
```

---

## 📺 Demo

```bash
$ clean-disk-space --dry-run

╔════════════════════════════════════════╗
║   🧹 macOS Disk Space Cleaner       ║
╚════════════════════════════════════════╝

⚠️  DRY RUN MODE - No changes will be made

💾 Disk Space:
  Total: 500GB
  Used: 450GB (90%)
  Available: 50GB

📦 Emptying Trash...
  Current size: 2.3GB
  💾 Would free: 2.3GB

🍺 Cleaning Homebrew cache...
  Can free: ~1.2GB

🗄️  Cleaning user caches...
  Current size: 3.5GB
  💾 Would free: 3.5GB

✨ Cleanup complete!
   Run with --deep for aggressive cleanup
```

---

## 🧹 What Gets Cleaned

### 📦 Standard Cleanup (Safe - Default)

| Item | What It Does | Typical Space Freed | Safe? |
|------|--------------|---------------------|-------|
| 🗑️ **Trash** | Empties `~/.Trash` | 0-5GB | ✅ Yes |
| 🍺 **Homebrew Cache** | Removes old downloads | 0.5-2GB | ✅ Yes |
| 🌐 **Browser Caches** | Safari, Chrome caches | 1-5GB | ✅ Yes |
| 📦 **npm Cache** | Cached packages | 0.5-2GB | ✅ Yes |
| 🧶 **Yarn Cache** | Cached dependencies | 0.5-2GB | ✅ Yes |
| 📝 **Old Logs** | Logs older than 30 days | 0.1-1GB | ✅ Yes |
| 📱 **Xcode DerivedData** | Build artifacts (rebuilds automatically) | 5-20GB | ✅ Yes* |

*Requires confirmation

**Total Typical Savings: 2-10GB** 💾

### 🔥 Deep Cleanup (Aggressive)

| Item | What It Does | Typical Space Freed | Requires Confirmation |
|------|--------------|---------------------|----------------------|
| 📂 **node_modules** | Removes all node_modules folders | 5-50GB | ⚠️ Yes |
| 🐳 **Docker** | Unused images/containers | 1-10GB | ⚠️ Yes |
| 💎 **CocoaPods** | iOS dependency cache | 0.5-5GB | ⚠️ Yes |
| 🤖 **Gradle** | Android build cache | 1-10GB | ⚠️ Yes |
| 📦 **Xcode Archives** | App distribution builds | 5-50GB | ⚠️ Yes |

**Total Typical Savings: 10-50GB+** 💾

---

## 🎯 Commands & Options

### Commands

```bash
clean-disk-space              # Standard cleanup (default)
clean-disk-space deep         # Aggressive cleanup
clean-disk-space help         # Show help
clean-disk-space docs         # Show full documentation
```

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Preview without making changes |
| `--yes` | `-y` | Auto-confirm all prompts |
| `--verbose` | `-v` | Detailed output |
| `--help` | `-h` | Show help |

---

## 📖 Common Workflows

### 🗓️ Monthly Maintenance

```bash
# Quick monthly cleanup (safe)
clean-disk-space --yes
```

### 💾 Low Disk Space Emergency

```bash
# Step 1: Preview standard cleanup
clean-disk-space --dry-run

# Step 2: Run standard cleanup
clean-disk-space

# Step 3: Preview deep cleanup
clean-disk-space deep --dry-run

# Step 4: Run deep cleanup (will ask for confirmation)
clean-disk-space deep
```

### 🔍 Exploration Mode

```bash
# Learn what it does
clean-disk-space docs

# See what would be cleaned
clean-disk-space --dry-run
clean-disk-space deep --dry-run
```

### 🚀 Before Major Updates

```bash
# Free maximum space before macOS update
clean-disk-space deep --dry-run
clean-disk-space deep
```

---

## 🛡️ Safety Features

### ✅ What's Safe to Delete

- ✅ Application caches (rebuilds automatically)
- ✅ Package manager caches (re-downloads on demand)
- ✅ Old log files (>30 days)
- ✅ Trash contents
- ✅ Build artifacts (can rebuild)

### ⚠️ What Requires Confirmation

- ⚠️ **node_modules**: Shows full list before deletion
- ⚠️ **Docker images**: May remove images you need
- ⚠️ **Xcode Archives**: App distribution builds (backup first!)
- ⚠️ **Build caches**: Gradle, CocoaPods

### ❌ What's NEVER Deleted

- ❌ System files
- ❌ Applications
- ❌ User documents
- ❌ Active project files
- ❌ Recent logs (<30 days)

---

## 💡 Pro Tips

1. **Always dry-run first**: `clean-disk-space --dry-run`
2. **Start with standard cleanup**: Only use deep mode when necessary
3. **Monthly maintenance**: Run `clean-disk-space --yes` monthly
4. **Before major updates**: Use deep cleanup before macOS upgrades
5. **node_modules cleanup**: Great for freeing 20GB+ for developers
6. **Keep backups**: Especially before cleaning Xcode Archives

---

## 🔧 Requirements

- **OS**: macOS 10.15 (Catalina) or later
- **Node.js**: v12.0.0 or later
- **Permissions**: Terminal access (no sudo required for most operations)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT © [CVSRohit](https://github.com/CVSRohit)

---

## 🔗 Links

- **npm Package**: https://www.npmjs.com/package/clean-disk-space
- **GitHub Repository**: https://github.com/CVSRohit/clean-disk-space
- **Report Issues**: https://github.com/CVSRohit/clean-disk-space/issues

---

## ⭐ Show Your Support

If this tool helped you free up disk space, please consider:
- ⭐ Starring the repository
- 📝 Writing a review
- 🤝 Contributing improvements
- 💬 Sharing with others

---

<div align="center">

**Made with ❤️ for the macOS community**

[![GitHub Stars](https://img.shields.io/github/stars/CVSRohit/clean-disk-space?style=social)](https://github.com/CVSRohit/clean-disk-space)

**Note**: Always have backups of important data before running cleanup tools!

</div>
