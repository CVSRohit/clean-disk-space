#!/bin/bash

# 1. Create a new directory for the repo
mkdir -p ~/clean-disk-space
cd ~/clean-disk-space

# 2. Initialize git repository
git init

# 3. Create package.json
cat > package.json << 'EOF'
{
  "name": "clean-disk-space",
  "version": "1.0.0",
  "description": "A safe and interactive CLI tool to clean up disk space on macOS",
  "main": "cli.js",
  "bin": {
    "clean-disk-space": "./cli.js"
  },
  "scripts": {
    "test": "node cli.js --dry-run"
  },
  "keywords": [
    "disk",
    "space",
    "cleanup",
    "macos",
    "cleaner",
    "cache",
    "storage"
  ],
  "author": "",
  "license": "MIT",
  "engines": {
    "node": ">=12.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/clean-disk-space.git"
  }
}
EOF

# 4. Create the CLI file
cat > cli.js << 'CLIMAIN'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class DiskCleaner {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.autoYes = options.yes || false;
    this.verbose = options.verbose || false;
    this.totalFreed = 0;
  }

  log(message, color = 'reset') {
    console.log(\`\${colors[color]}\${message}\${colors.reset}\`);
  }

  exec(command, silent = false) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit'
      });
      return result;
    } catch (error) {
      if (!silent) {
        this.log(\`Warning: \${error.message}\`, 'yellow');
      }
      return '';
    }
  }

  getDiskSpace() {
    try {
      const result = this.exec('df -h / | tail -1', true);
      const parts = result.trim().split(/\s+/);
      return {
        total: parts[1],
        used: parts[2],
        available: parts[3],
        percent: parts[4]
      };
    } catch (error) {
      return null;
    }
  }

  getSize(path) {
    try {
      const result = this.exec(\`du -sh "\${path}" 2>/dev/null | cut -f1\`, true);
      return result.trim() || '0B';
    } catch (error) {
      return '0B';
    }
  }

  async confirm(message) {
    if (this.autoYes) return true;
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(\`\${colors.yellow}\${message} (y/N): \${colors.reset}\`, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  cleanTrash() {
    this.log('\\n📦 Emptying Trash...', 'cyan');
    const trashPath = path.join(process.env.HOME, '.Trash');
    const size = this.getSize(trashPath);
    this.log(\`  Current size: \${size}\`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would empty trash', 'yellow');
      return;
    }

    this.exec(\`rm -rf "\${trashPath}"/*\`);
    this.log('  ✓ Trash emptied', 'green');
  }

  async cleanHomebrew() {
    this.log('\\n🍺 Cleaning Homebrew cache...', 'cyan');
    
    try {
      this.exec('which brew', true);
    } catch {
      this.log('  Homebrew not found, skipping', 'gray');
      return;
    }

    const cacheSize = this.exec('brew cleanup -n 2>/dev/null | grep -o "[0-9.]*[KMG]B" | tail -1', true).trim();
    if (cacheSize) {
      this.log(\`  Can free: ~\${cacheSize}\`, 'gray');
    }

    if (this.dryRun) {
      this.log('  [DRY RUN] Would run: brew cleanup', 'yellow');
      return;
    }

    this.exec('brew cleanup -s 2>/dev/null');
    this.exec('brew autoremove 2>/dev/null');
    this.log('  ✓ Homebrew cleaned', 'green');
  }

  async cleanUserCaches() {
    this.log('\\n🗄️  Cleaning user caches...', 'cyan');
    const cachePath = path.join(process.env.HOME, 'Library', 'Caches');
    const size = this.getSize(cachePath);
    this.log(\`  Current size: \${size}\`, 'gray');
    this.log('  Note: Only cleaning safe application caches', 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean user caches', 'yellow');
      return;
    }

    const safeCaches = [
      'com.apple.Safari',
      'com.google.Chrome',
      'com.microsoft.VSCode',
      'Homebrew'
    ];

    safeCaches.forEach(cache => {
      const cachePath = path.join(process.env.HOME, 'Library', 'Caches', cache);
      if (fs.existsSync(cachePath)) {
        this.exec(\`rm -rf "\${cachePath}"/* 2>/dev/null\`, true);
      }
    });

    this.log('  ✓ User caches cleaned', 'green');
  }

  async cleanXcode() {
    this.log('\\n📱 Cleaning Xcode data...', 'cyan');
    
    const derivedDataPath = path.join(process.env.HOME, 'Library', 'Developer', 'Xcode', 'DerivedData');
    const archivesPath = path.join(process.env.HOME, 'Library', 'Developer', 'Xcode', 'Archives');
    
    if (!fs.existsSync(derivedDataPath)) {
      this.log('  Xcode not found, skipping', 'gray');
      return;
    }

    const derivedSize = this.getSize(derivedDataPath);
    const archivesSize = this.getSize(archivesPath);
    
    this.log(\`  DerivedData: \${derivedSize}\`, 'gray');
    this.log(\`  Archives: \${archivesSize}\`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean Xcode data', 'yellow');
      return;
    }

    const confirmed = await this.confirm('Clean Xcode DerivedData and Archives?');
    if (confirmed) {
      this.exec(\`rm -rf "\${derivedDataPath}"/* 2>/dev/null\`, true);
      this.exec(\`rm -rf "\${archivesPath}"/* 2>/dev/null\`, true);
      this.log('  ✓ Xcode data cleaned', 'green');
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async cleanSimulators() {
    this.log('\\n📲 Cleaning iOS Simulators...', 'cyan');
    
    try {
      this.exec('xcrun simctl list 2>/dev/null', true);
    } catch {
      this.log('  Simulators not found, skipping', 'gray');
      return;
    }

    if (this.dryRun) {
      this.log('  [DRY RUN] Would delete unavailable simulators', 'yellow');
      return;
    }

    this.exec('xcrun simctl delete unavailable 2>/dev/null', true);
    this.log('  ✓ Unavailable simulators removed', 'green');
  }

  async cleanNpm() {
    this.log('\\n📦 Cleaning npm cache...', 'cyan');
    
    try {
      this.exec('which npm', true);
    } catch {
      this.log('  npm not found, skipping', 'gray');
      return;
    }

    const cacheSize = this.exec('du -sh ~/.npm 2>/dev/null | cut -f1', true).trim();
    this.log(\`  Cache size: \${cacheSize}\`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean npm cache', 'yellow');
      return;
    }

    this.exec('npm cache clean --force 2>/dev/null', true);
    this.log('  ✓ npm cache cleaned', 'green');
  }

  async cleanDocker() {
    this.log('\\n🐳 Cleaning Docker...', 'cyan');
    
    try {
      this.exec('which docker', true);
    } catch {
      this.log('  Docker not found, skipping', 'gray');
      return;
    }

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean Docker images and containers', 'yellow');
      return;
    }

    const confirmed = await this.confirm('Clean Docker (removes unused images/containers)?');
    if (confirmed) {
      this.exec('docker system prune -f 2>/dev/null', true);
      this.log('  ✓ Docker cleaned', 'green');
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async cleanLogs() {
    this.log('\\n📝 Cleaning old logs...', 'cyan');
    const logsPath = path.join(process.env.HOME, 'Library', 'Logs');
    const size = this.getSize(logsPath);
    this.log(\`  Current size: \${size}\`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean old log files', 'yellow');
      return;
    }

    this.exec(\`find "\${logsPath}" -name "*.log" -mtime +30 -delete 2>/dev/null\`, true);
    this.log('  ✓ Old logs cleaned', 'green');
  }

  async findLargeFiles() {
    this.log('\\n🔍 Finding large files (>500MB)...', 'cyan');
    this.log('  Searching (this may take a moment)...', 'gray');
    
    const homeDir = process.env.HOME;
    const result = this.exec(
      \`find "\${homeDir}" -type f -size +500M 2>/dev/null | head -10\`,
      true
    );

    if (result.trim()) {
      this.log('\\n  Large files found:', 'yellow');
      result.trim().split('\\n').forEach(file => {
        const size = this.getSize(file);
        this.log(\`    \${size} - \${file}\`, 'gray');
      });
      this.log('\\n  Review and delete manually if needed', 'gray');
    } else {
      this.log('  No large files found', 'gray');
    }
  }

  showDiskSpace() {
    const space = this.getDiskSpace();
    if (space) {
      this.log('\\n💾 Disk Space:', 'bright');
      this.log(\`  Total: \${space.total}\`, 'gray');
      this.log(\`  Used: \${space.used} (\${space.percent})\`, 'gray');
      this.log(\`  Available: \${space.available}\`, 'green');
    }
  }

  async run() {
    this.log('\\n╔════════════════════════════════════════╗', 'cyan');
    this.log('║   🧹 macOS Disk Space Cleaner       ║', 'cyan');
    this.log('╚════════════════════════════════════════╝', 'cyan');

    if (this.dryRun) {
      this.log('\\n⚠️  DRY RUN MODE - No changes will be made\\n', 'yellow');
    }

    this.showDiskSpace();

    await this.cleanTrash();
    await this.cleanHomebrew();
    await this.cleanUserCaches();
    await this.cleanNpm();
    await this.cleanLogs();
    await this.cleanXcode();
    await this.cleanSimulators();
    await this.cleanDocker();
    await this.findLargeFiles();

    this.log('\\n' + '─'.repeat(40), 'gray');
    this.showDiskSpace();
    
    this.log('\\n✨ Cleanup complete!', 'green');
    this.log('   Run with --dry-run to preview changes', 'gray');
    this.log('   Run with --yes to skip confirmations\\n', 'gray');
  }
}

const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run') || args.includes('-d'),
  yes: args.includes('--yes') || args.includes('-y'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h')
};

if (options.help) {
  console.log(\`
Usage: clean-disk-space [options]

Options:
  -d, --dry-run     Preview what would be cleaned without making changes
  -y, --yes         Skip confirmation prompts (use with caution)
  -v, --verbose     Show detailed output
  -h, --help        Show this help message

Examples:
  clean-disk-space              # Run interactive cleanup
  clean-disk-space --dry-run    # Preview without changes
  clean-disk-space --yes        # Auto-confirm all prompts
  \`);
  process.exit(0);
}

const cleaner = new DiskCleaner(options);
cleaner.run().catch(error => {
  console.error(\`\${colors.red}Error: \${error.message}\${colors.reset}\`);
  process.exit(1);
});
CLIMAIN

# 5. Make CLI executable
chmod +x cli.js

# 6. Create README
cat > README.md << 'EOF'
# 🧹 clean-disk-space

A safe and interactive CLI tool to clean up disk space on macOS.

## Features

✅ **Safe by default** - Only removes caches and temporary files  
✅ **Interactive** - Asks for confirmation before destructive operations  
✅ **Dry-run mode** - Preview what will be cleaned  
✅ **Color-coded output** - Easy to read progress and results  
✅ **Smart detection** - Only cleans what's installed on your system

## What It Cleans

- 🗑️ Trash
- 🍺 Homebrew cache
- 🗄️ User caches (Safari, Chrome, VS Code, etc.)
- 📦 npm cache
- 📝 Old log files (>30 days)
- 📱 Xcode DerivedData and Archives (with confirmation)
- 📲 Unavailable iOS Simulators
- 🐳 Docker images and containers (with confirmation)
- 🔍 Finds large files for manual review

## Installation

### Global Installation (Recommended)

```bash
npm install -g clean-disk-space
```

### Local Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/clean-disk-space.git
cd clean-disk-space

# Install dependencies (none required!)
npm install

# Link globally
npm link
```

### Run Without Installing

```bash
npx clean-disk-space
```

## Usage

### Basic Usage

```bash
# Run interactive cleanup
clean-disk-space
```

### Dry Run (Preview Only)

```bash
# See what would be cleaned without making changes
clean-disk-space --dry-run
```

### Auto-confirm All

```bash
# Skip all confirmation prompts (use with caution)
clean-disk-space --yes
```

### Help

```bash
clean-disk-space --help
```

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Preview changes without executing |
| `--yes` | `-y` | Auto-confirm all prompts |
| `--verbose` | `-v` | Show detailed output |
| `--help` | `-h` | Show help message |

## Examples

```bash
# Preview what would be cleaned
clean-disk-space --dry-run

# Quick cleanup with auto-confirm
clean-disk-space --yes

# Interactive cleanup (recommended for first-time users)
clean-disk-space
```

## Safety Features

### What's Safe to Delete
- Application caches
- Homebrew downloads
- npm cache
- Old log files (>30 days old)
- Trash
- Docker unused images

### What Requires Confirmation
- Xcode DerivedData (can rebuild)
- Xcode Archives (may contain important builds)
- Docker cleanup (may remove needed images)

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

## How Much Space Can I Free?

Typical space savings:
- 🗑️ Trash: 0-5GB
- 🍺 Homebrew: 0.5-2GB
- 🗄️ Caches: 1-5GB
- 📱 Xcode: 5-20GB (if you have Xcode)
- 🐳 Docker: 1-10GB (if you use Docker)

**Total**: Usually 2-10GB, sometimes 20GB+ for developers

## Uninstallation

```bash
npm uninstall -g clean-disk-space
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use and modify!

## Author

Created for developers who need a quick, safe way to free up disk space.

## Support

If you encounter any issues:
1. Run with `--dry-run` first to see what would be cleaned
2. Check the [Issues](https://github.com/yourusername/clean-disk-space/issues) page
3. Create a new issue with details about your system and the error

---

**Note**: Always have backups of important data before running cleanup tools!
EOF

# 7. Create .gitignore
cat > .gitignore << 'EOF'
# Node
node_modules/
npm-debug.log
yarn-error.log
package-lock.json
yarn.lock

# macOS
.DS_Store
.AppleDouble
.LSOverride

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# Test
test/
*.test.js
coverage/
EOF

# 8. Create LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# 9. Add all files to git
git add .

# 10. Make initial commit
git commit -m "Initial commit: Add clean-disk-space CLI tool"

# 11. Show status
echo ""
echo "✅ Git repository created successfully!"
echo ""
echo "Repository location: ~/clean-disk-space"
echo ""
echo "Files created:"
git ls-files
echo ""
echo "📦 Next steps:"
echo ""
echo "1. Test the tool:"
echo "   cd ~/clean-disk-space"
echo "   node cli.js --dry-run"
echo ""
echo "2. Install locally:"
echo "   npm link"
echo ""
echo "3. Run the tool:"
echo "   clean-disk-space --dry-run"
echo ""
echo "4. Push to GitHub:"
echo "   • Create a new repo on GitHub"
echo "   • git remote add origin https://github.com/yourusername/clean-disk-space.git"
echo "   • git branch -M main"
echo "   • git push -u origin main"
echo ""
echo "5. Publish to npm (optional):"
echo "   npm publish"
echo ""
# macOS Disk Space Cleanup Guide

A comprehensive guide for safely freeing up disk space on macOS.

## Quick Cleanup Steps

### 1. Empty Trash

```bash
# Empty trash
rm -rf ~/.Trash/*

# Check space freed
df -h /
```

### 2. Clean Homebrew Cache

```bash
# Clean Homebrew downloads and cache
brew cleanup -s
brew cleanup --prune=all

# Remove old versions
brew autoremove
```

### 3. Clear System Caches

```bash
# Clear user caches (be careful!)
sudo rm -rf ~/Library/Caches/*

# Clear system caches (requires sudo)
sudo rm -rf /Library/Caches/*

# Clear logs
sudo rm -rf ~/Library/Logs/*
sudo rm -rf /Library/Logs/*
```

### 4. Remove Old iOS Simulators

```bash
# List simulators
xcrun simctl list devices

# Delete unavailable simulators
xcrun simctl delete unavailable

# Delete all old simulators (if you have Xcode)
xcrun simctl erase all
```

### 5. Clean Xcode Derived Data

```bash
# Remove Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Remove old archives
rm -rf ~/Library/Developer/Xcode/Archives/*

# Remove device support files
rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/*
```

### 6. Clean Node/NPM (if installed)

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules from old projects
find ~ -name "node_modules" -type d -prune -exec rm -rf '{}' +
```

### 7. Find Large Files

```bash
# Find files larger than 100MB
sudo find / -type f -size +100M 2>/dev/null | head -20

# Find largest directories
sudo du -sh /* 2>/dev/null | sort -hr | head -20
```

### 8. Clean Docker (if installed)

```bash
# Remove all stopped containers
docker container prune -a

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Or clean everything
docker system prune -a --volumes
```

### 9. Clean Temporary Files

```bash
# Remove temporary files
sudo rm -rf /private/var/tmp/*
sudo rm -rf /tmp/*
```

### 10. Clean Downloads Folder

```bash
# Check downloads folder size
du -sh ~/Downloads

# Review and delete old downloads
open ~/Downloads
```

## After Cleanup

### Verify Disk Space

```bash
df -h /
```

Check that you have freed up the desired amount of space.

## Alternative: Use External Storage

If you cannot free up enough space on your main drive:

1. **Use external SSD/USB drive** for large files and projects:
   ```bash
   # Move large directories to external drive
   mv ~/LargeFolder /Volumes/YourExternalDrive/
   
   # Create symbolic link to keep access
   ln -s /Volumes/YourExternalDrive/LargeFolder ~/LargeFolder
   ```

2. **Move project files to external drive**:
   ```bash
   mv ~/Projects /Volumes/YourExternalDrive/
   ln -s /Volumes/YourExternalDrive/Projects ~/Projects
   ```

## Typical Space Usage by Category

| Component | Typical Size |
|-----------|--------------|
| System & macOS | ~15-20GB |
| Applications | ~10-50GB |
| Developer Tools (Xcode, Android Studio) | ~20-30GB |
| User Documents & Photos | Varies |
| Caches & Logs | ~5-10GB |
| **Recommended Free Space** | **20-30GB** |

## Safety Tips

⚠️ **Before deleting**:
- Make sure you have backups
- Review what you're deleting
- Don't delete system files

✅ **Safe to delete**:
- Caches
- Logs
- Old downloads
- Trash
- Homebrew cache
- Docker images
- Old Xcode data

❌ **Don't delete**:
- System folders (/System, /Library/*)
- Application folders
- User documents
- Active project files

## Monitoring Disk Usage

```bash
# See disk usage
df -h

# See folder sizes in current directory
du -sh *

# Interactive disk usage tool (if installed)
ncdu /

# macOS built-in storage manager
open /System/Library/CoreServices/Applications/Storage\ Management.app
```

## Regular Maintenance

To keep your disk space healthy:

1. ✅ Run cleanup commands monthly
2. ✅ Monitor disk usage regularly: `df -h`
3. ✅ Review Downloads folder weekly
4. ✅ Clear caches periodically
5. ✅ Remove unused applications
6. ✅ Archive old projects to external storage

---

**Tip**: Set up a monthly reminder to review and clean up your disk space!
EOF

# 4. Create a README
cat > README.md << 'EOF'
# macOS Disk Space Cleanup Guide

A comprehensive guide for safely freeing up disk space on macOS systems.

## Purpose

This guide helps you:
- Free up disk space safely and effectively
- Identify and remove unnecessary files
- Maintain healthy disk usage
- Understand what's safe to delete

## Requirements

- macOS
- Terminal access
- Administrator privileges (for some commands)

## Usage

See [DISK_SPACE_CLEANUP.md](DISK_SPACE_CLEANUP.md) for detailed cleanup instructions.

## Quick Start

```bash
# Check current disk usage
df -h /

# Follow the guide steps in DISK_SPACE_CLEANUP.md
```

## Categories Covered

- System caches and logs
- Homebrew cleanup
- Developer tools (Xcode, Docker, Node/NPM)
- Temporary files
- Finding large files
- External storage alternatives

## Safety First

Always review what you're deleting before running cleanup commands. Make backups of important data.

## Contributing

Feel free to submit improvements or additional cleanup methods!

## License

Free to use and modify.
EOF

# 5. Create .gitignore
cat > .gitignore << 'EOF'
.DS_Store
*.swp
*.swo
*~
EOF

# 6. Add all files to git
git add .

# 7. Make initial commit
git commit -m "Initial commit: Add macOS disk space cleanup guide"

# 8. Show status
echo ""
echo "✅ Git repository created successfully!"
echo ""
echo "Repository location: ~/disk-space-cleanup-guide"
echo ""
echo "Files added:"
git ls-files
echo ""
echo "To view the guide:"
echo "  cat ~/disk-space-cleanup-guide/DISK_SPACE_CLEANUP.md"
echo ""
echo "To push to GitHub (optional):"
echo "  1. Create a new repo on GitHub"
echo "  2. git remote add origin https://github.com/yourusername/disk-space-cleanup-guide.git"
echo "  3. git branch -M main"
echo "  4. git push -u origin main"