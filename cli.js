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
    console.log(`${colors[color]}${message}${colors.reset}`);
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
        this.log(`Warning: ${error.message}`, 'yellow');
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
      const result = this.exec(`du -sh "${path}" 2>/dev/null | cut -f1`, true);
      return result.trim() || '0B';
    } catch (error) {
      return '0B';
    }
  }

  getSizeInBytes(path) {
    try {
      const result = this.exec(`du -sk "${path}" 2>/dev/null | cut -f1`, true);
      const kb = parseInt(result.trim()) || 0;
      return kb * 1024; // Convert to bytes
    } catch (error) {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
  }

  trackFreedSpace(beforeBytes, afterBytes, label) {
    const freed = beforeBytes - afterBytes;
    if (freed > 0) {
      this.totalFreed += freed;
      this.log(`  💾 Freed: ${this.formatBytes(freed)}`, 'green');
    }
  }

  async confirm(message) {
    if (this.autoYes) return true;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${colors.yellow}${message} (y/N): ${colors.reset}`, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  cleanTrash() {
    this.log('\n📦 Emptying Trash...', 'cyan');
    const trashPath = path.join(process.env.HOME, '.Trash');
    const beforeSize = this.getSizeInBytes(trashPath);
    const size = this.getSize(trashPath);
    this.log(`  Current size: ${size}`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would empty trash', 'yellow');
      this.log(`  💾 Would free: ${size}`, 'yellow');
      return;
    }

    this.exec(`rm -rf "${trashPath}"/*`);
    const afterSize = this.getSizeInBytes(trashPath);
    this.log('  ✓ Trash emptied', 'green');
    this.trackFreedSpace(beforeSize, afterSize);
  }

  async cleanHomebrew() {
    this.log('\n🍺 Cleaning Homebrew cache...', 'cyan');

    try {
      this.exec('which brew', true);
    } catch {
      this.log('  Homebrew not found, skipping', 'gray');
      return;
    }

    const cacheSize = this.exec('brew cleanup -n 2>/dev/null | grep -o "[0-9.]*[KMG]B" | tail -1', true).trim();
    if (cacheSize) {
      this.log(`  Can free: ~${cacheSize}`, 'gray');
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
    this.log('\n🗄️  Cleaning user caches...', 'cyan');
    const cachePath = path.join(process.env.HOME, 'Library', 'Caches');
    this.log('  Note: Only cleaning safe application caches', 'gray');

    const safeCaches = [
      'com.apple.Safari',
      'com.google.Chrome',
      'com.microsoft.VSCode',
      'Homebrew',
      'pip',
      'yarn'
    ];

    let totalBefore = 0;
    let totalAfter = 0;

    safeCaches.forEach(cache => {
      const fullCachePath = path.join(process.env.HOME, 'Library', 'Caches', cache);
      if (fs.existsSync(fullCachePath)) {
        totalBefore += this.getSizeInBytes(fullCachePath);
      }
    });

    const size = this.formatBytes(totalBefore);
    this.log(`  Current size: ${size}`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean user caches', 'yellow');
      this.log(`  💾 Would free: ${size}`, 'yellow');
      return;
    }

    safeCaches.forEach(cache => {
      const fullCachePath = path.join(process.env.HOME, 'Library', 'Caches', cache);
      if (fs.existsSync(fullCachePath)) {
        this.exec(`rm -rf "${fullCachePath}"/* 2>/dev/null`, true);
        totalAfter += this.getSizeInBytes(fullCachePath);
      }
    });

    this.log('  ✓ User caches cleaned', 'green');
    this.trackFreedSpace(totalBefore, totalAfter);
  }

  async cleanXcode() {
    this.log('\n📱 Cleaning Xcode data...', 'cyan');

    const derivedDataPath = path.join(process.env.HOME, 'Library', 'Developer', 'Xcode', 'DerivedData');

    if (!fs.existsSync(derivedDataPath)) {
      this.log('  Xcode not found, skipping', 'gray');
      return;
    }

    const beforeSize = this.getSizeInBytes(derivedDataPath);
    const derivedSize = this.getSize(derivedDataPath);

    this.log(`  DerivedData: ${derivedSize}`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean Xcode DerivedData', 'yellow');
      this.log(`  💾 Would free: ${derivedSize}`, 'yellow');
      return;
    }

    const confirmed = await this.confirm('Clean Xcode DerivedData? (safe to rebuild)');
    if (confirmed) {
      this.exec(`rm -rf "${derivedDataPath}"/* 2>/dev/null`, true);
      const afterSize = this.getSizeInBytes(derivedDataPath);
      this.log('  ✓ Xcode DerivedData cleaned', 'green');
      this.trackFreedSpace(beforeSize, afterSize);
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async cleanNpm() {
    this.log('\n📦 Cleaning npm cache...', 'cyan');

    try {
      this.exec('which npm', true);
    } catch {
      this.log('  npm not found, skipping', 'gray');
      return;
    }

    const cacheSize = this.exec('du -sh ~/.npm 2>/dev/null | cut -f1', true).trim();
    this.log(`  Cache size: ${cacheSize}`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean npm cache', 'yellow');
      return;
    }

    this.exec('npm cache clean --force 2>/dev/null', true);
    this.log('  ✓ npm cache cleaned', 'green');
  }

  async cleanYarn() {
    this.log('\n🧶 Cleaning Yarn cache...', 'cyan');

    try {
      this.exec('which yarn', true);
    } catch {
      this.log('  Yarn not found, skipping', 'gray');
      return;
    }

    const cacheSize = this.exec('du -sh $(yarn cache dir) 2>/dev/null | cut -f1', true).trim();
    if (cacheSize) {
      this.log(`  Cache size: ${cacheSize}`, 'gray');
    }

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean Yarn cache', 'yellow');
      return;
    }

    this.exec('yarn cache clean 2>/dev/null', true);
    this.log('  ✓ Yarn cache cleaned', 'green');
  }

  async cleanLogs() {
    this.log('\n📝 Cleaning old logs...', 'cyan');
    const logsPath = path.join(process.env.HOME, 'Library', 'Logs');
    const size = this.getSize(logsPath);
    this.log(`  Current size: ${size}`, 'gray');
    this.log('  Only removing logs older than 30 days', 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean old log files', 'yellow');
      return;
    }

    this.exec(`find "${logsPath}" -name "*.log" -mtime +30 -delete 2>/dev/null`, true);
    this.log('  ✓ Old logs cleaned', 'green');
  }

  async cleanNodeModules() {
    this.log('\n📂 Cleaning node_modules folders...', 'cyan');
    this.log('  ⚠️  WARNING: This will delete node_modules in old projects', 'red');
    this.log('  Searching for node_modules folders...', 'gray');

    const homeDir = process.env.HOME;
    const result = this.exec(
      `find "${homeDir}" -name "node_modules" -type d -maxdepth 4 2>/dev/null`,
      true
    );

    if (!result.trim()) {
      this.log('  No node_modules folders found', 'gray');
      return;
    }

    const folders = result.trim().split('\n');
    let totalSizeBytes = 0;
    const folderSizes = [];

    folders.forEach(folder => {
      const sizeBytes = this.getSizeInBytes(folder);
      const size = this.getSize(folder);
      totalSizeBytes += sizeBytes;
      folderSizes.push({ path: folder, size });
    });

    this.log(`\n  Found ${folders.length} node_modules folders:`, 'yellow');
    this.log(`  Total size: ${this.formatBytes(totalSizeBytes)}`, 'yellow');
    folderSizes.forEach(({ path, size }) => {
      this.log(`    ${size} - ${path}`, 'gray');
    });

    if (this.dryRun) {
      this.log('\n  [DRY RUN] Would delete these node_modules folders', 'yellow');
      this.log(`  💾 Would free: ${this.formatBytes(totalSizeBytes)}`, 'yellow');
      return;
    }

    const confirmed = await this.confirm('\n  Delete ALL these node_modules folders?');
    if (confirmed) {
      folders.forEach(folder => {
        this.exec(`rm -rf "${folder}" 2>/dev/null`, true);
      });
      this.log('  ✓ node_modules folders deleted', 'green');
      this.log('  Run "npm install" in projects to restore dependencies', 'gray');
      this.trackFreedSpace(totalSizeBytes, 0);
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async cleanDocker() {
    this.log('\n🐳 Cleaning Docker...', 'cyan');

    try {
      this.exec('which docker', true);
    } catch {
      this.log('  Docker not found, skipping', 'gray');
      return;
    }

    this.log('  ⚠️  WARNING: This removes unused Docker images/containers', 'red');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean Docker images and containers', 'yellow');
      const preview = this.exec('docker system df 2>/dev/null', true);
      if (preview) {
        this.log('\n' + preview, 'gray');
      }
      return;
    }

    const confirmed = await this.confirm('Clean Docker (removes unused images/containers)?');
    if (confirmed) {
      this.exec('docker system prune -af 2>/dev/null', true);
      this.log('  ✓ Docker cleaned', 'green');
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async cleanPodCache() {
    this.log('\n💎 Cleaning CocoaPods cache...', 'cyan');

    const podCachePath = path.join(process.env.HOME, 'Library', 'Caches', 'CocoaPods');
    if (!fs.existsSync(podCachePath)) {
      this.log('  CocoaPods cache not found, skipping', 'gray');
      return;
    }

    const size = this.getSize(podCachePath);
    this.log(`  Cache size: ${size}`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean CocoaPods cache', 'yellow');
      return;
    }

    const confirmed = await this.confirm('Clean CocoaPods cache?');
    if (confirmed) {
      this.exec(`rm -rf "${podCachePath}" 2>/dev/null`, true);
      this.log('  ✓ CocoaPods cache cleaned', 'green');
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async cleanGradleCache() {
    this.log('\n🤖 Cleaning Gradle cache...', 'cyan');

    const gradlePath = path.join(process.env.HOME, '.gradle', 'caches');
    if (!fs.existsSync(gradlePath)) {
      this.log('  Gradle cache not found, skipping', 'gray');
      return;
    }

    const size = this.getSize(gradlePath);
    this.log(`  Cache size: ${size}`, 'gray');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean Gradle cache', 'yellow');
      return;
    }

    const confirmed = await this.confirm('Clean Gradle cache?');
    if (confirmed) {
      this.exec(`rm -rf "${gradlePath}" 2>/dev/null`, true);
      this.log('  ✓ Gradle cache cleaned', 'green');
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async cleanXcodeArchives() {
    this.log('\n📦 Cleaning Xcode Archives...', 'cyan');

    const archivesPath = path.join(process.env.HOME, 'Library', 'Developer', 'Xcode', 'Archives');
    if (!fs.existsSync(archivesPath)) {
      this.log('  Xcode Archives not found, skipping', 'gray');
      return;
    }

    const size = this.getSize(archivesPath);
    this.log(`  Archives size: ${size}`, 'gray');
    this.log('  ⚠️  WARNING: This may contain important app builds', 'red');

    if (this.dryRun) {
      this.log('  [DRY RUN] Would clean Xcode Archives', 'yellow');
      return;
    }

    const confirmed = await this.confirm('Clean Xcode Archives? (cannot be recovered)');
    if (confirmed) {
      this.exec(`rm -rf "${archivesPath}"/* 2>/dev/null`, true);
      this.log('  ✓ Xcode Archives cleaned', 'green');
    } else {
      this.log('  Skipped', 'gray');
    }
  }

  async findLargeFiles() {
    this.log('\n🔍 Finding large files (>1GB)...', 'cyan');
    this.log('  Searching (this may take a moment)...', 'gray');

    const homeDir = process.env.HOME;
    const result = this.exec(
      `find "${homeDir}/Downloads" "${homeDir}/Documents" -type f -size +1G 2>/dev/null | head -10`,
      true
    );

    if (result.trim()) {
      this.log('\n  Large files found:', 'yellow');
      result.trim().split('\n').forEach(file => {
        const size = this.getSize(file);
        this.log(`    ${size} - ${file}`, 'gray');
      });
      this.log('\n  Review and delete manually if needed', 'gray');
    } else {
      this.log('  No large files found in Downloads/Documents', 'gray');
    }
  }

  showDiskSpace() {
    const space = this.getDiskSpace();
    if (space) {
      this.log('\n💾 Disk Space:', 'bright');
      this.log(`  Total Capacity: ${space.total}`, 'gray');
      this.log(`  Used: ${space.used} (${space.percent})`, 'gray');
      this.log(`  Available: ${space.available}`, 'green');

      // Add APFS clarification if the numbers seem unusual
      const usedNum = parseFloat(space.used);
      const availNum = parseFloat(space.available);
      const totalNum = parseFloat(space.total);

      if (totalNum > (usedNum + availNum) * 2) {
        this.log(`  Note: APFS dynamically allocates ${(usedNum + availNum).toFixed(1)}Gi of ${space.total}`, 'gray');
      }
    }
  }

  async runDeepClean() {
    this.log('\n╔════════════════════════════════════════╗', 'red');
    this.log('║   🔥 DEEP CLEAN MODE               ║', 'red');
    this.log('╚════════════════════════════════════════╝', 'red');
    this.log('\n⚠️  WARNING: Deep clean includes potentially destructive operations', 'red');

    if (this.dryRun) {
      this.log('⚠️  DRY RUN MODE - No changes will be made\n', 'yellow');
    }

    this.showDiskSpace();

    await this.cleanNodeModules();
    await this.cleanDocker();
    await this.cleanPodCache();
    await this.cleanGradleCache();
    await this.cleanXcodeArchives();

    this.log('\n' + '─'.repeat(40), 'gray');
    this.showDiskSpace();

    this.log('\n✨ Deep cleanup complete!', 'green');
  }

  async run() {
    this.log('\n╔════════════════════════════════════════╗', 'cyan');
    this.log('║   🧹 macOS Disk Space Cleaner       ║', 'cyan');
    this.log('╚════════════════════════════════════════╝', 'cyan');

    if (this.dryRun) {
      this.log('\n⚠️  DRY RUN MODE - No changes will be made\n', 'yellow');
    }

    this.showDiskSpace();
    this.totalFreed = 0;

    await this.cleanTrash();
    await this.cleanHomebrew();
    await this.cleanUserCaches();
    await this.cleanNpm();
    await this.cleanYarn();
    await this.cleanLogs();
    await this.cleanXcode();
    await this.findLargeFiles();

    this.log('\n' + '─'.repeat(40), 'gray');
    this.showDiskSpace();

    if (this.totalFreed > 0 && !this.dryRun) {
      this.log(`\n🎉 Total space freed: ${this.formatBytes(this.totalFreed)}`, 'bright');
    }

    this.log('\n✨ Cleanup complete!', 'green');
    this.log('   Run with --dry-run to preview changes', 'gray');
    this.log('   Run with --yes to skip confirmations', 'gray');
    this.log('   Run with --deep for aggressive cleanup\n', 'gray');
  }

  async runDeepClean() {
    this.log('\n╔════════════════════════════════════════╗', 'red');
    this.log('║   🔥 DEEP CLEAN MODE               ║', 'red');
    this.log('╚════════════════════════════════════════╝', 'red');
    this.log('\n⚠️  WARNING: Deep clean includes potentially destructive operations', 'red');

    if (this.dryRun) {
      this.log('⚠️  DRY RUN MODE - No changes will be made\n', 'yellow');
    }

    this.showDiskSpace();
    this.totalFreed = 0;

    await this.cleanNodeModules();
    await this.cleanDocker();
    await this.cleanPodCache();
    await this.cleanGradleCache();
    await this.cleanXcodeArchives();

    this.log('\n' + '─'.repeat(40), 'gray');
    this.showDiskSpace();

    if (this.totalFreed > 0 && !this.dryRun) {
      this.log(`\n🎉 Total space freed: ${this.formatBytes(this.totalFreed)}`, 'bright');
    }

    this.log('\n✨ Deep cleanup complete!', 'green');
  }
}

const HELP_TEXT = `
${colors.cyan}╔════════════════════════════════════════╗${colors.reset}
${colors.cyan}║   🧹 macOS Disk Space Cleaner       ║${colors.reset}
${colors.cyan}╚════════════════════════════════════════╝${colors.reset}

${colors.bright}USAGE:${colors.reset}
  clean-disk-space [command] [options]

${colors.bright}COMMANDS:${colors.reset}
  ${colors.green}clean${colors.reset}         Run standard cleanup (default)
  ${colors.red}deep${colors.reset}          Run deep cleanup (includes node_modules, Docker, etc.)
  ${colors.cyan}docs${colors.reset}          Show detailed documentation
  ${colors.cyan}help${colors.reset}          Show this help message

${colors.bright}OPTIONS:${colors.reset}
  ${colors.yellow}-d, --dry-run${colors.reset}     Preview what would be cleaned without making changes
  ${colors.yellow}-y, --yes${colors.reset}         Skip confirmation prompts (use with caution)
  ${colors.yellow}-v, --verbose${colors.reset}     Show detailed output
  ${colors.yellow}-h, --help${colors.reset}        Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.gray}# Run standard cleanup${colors.reset}
  clean-disk-space

  ${colors.gray}# Preview standard cleanup${colors.reset}
  clean-disk-space --dry-run

  ${colors.gray}# Run deep cleanup with confirmation${colors.reset}
  clean-disk-space deep

  ${colors.gray}# Preview deep cleanup${colors.reset}
  clean-disk-space deep --dry-run

  ${colors.gray}# View documentation${colors.reset}
  clean-disk-space docs

${colors.bright}STANDARD CLEANUP INCLUDES:${colors.reset}
  ✓ Trash
  ✓ Homebrew cache
  ✓ Browser caches (Safari, Chrome)
  ✓ npm & Yarn caches
  ✓ Old logs (>30 days)
  ✓ Xcode DerivedData (with confirmation)
  ✓ Large file finder

${colors.bright}DEEP CLEANUP INCLUDES:${colors.reset}
  ${colors.red}⚠${colors.reset}  node_modules folders (requires confirmation)
  ${colors.red}⚠${colors.reset}  Docker images & containers (requires confirmation)
  ${colors.red}⚠${colors.reset}  CocoaPods cache (requires confirmation)
  ${colors.red}⚠${colors.reset}  Gradle cache (requires confirmation)
  ${colors.red}⚠${colors.reset}  Xcode Archives (requires confirmation)

${colors.yellow}Note: Deep cleanup operations require explicit user confirmation${colors.reset}
`;

const DOCS_TEXT = `
${colors.cyan}╔════════════════════════════════════════╗${colors.reset}
${colors.cyan}║   📚 Documentation                  ║${colors.reset}
${colors.cyan}╚════════════════════════════════════════╝${colors.reset}

${colors.bright}WHAT IS CLEAN-DISK-SPACE?${colors.reset}
A safe and interactive CLI tool to clean up disk space on macOS.
It provides both standard and deep cleaning options with user confirmations
for potentially destructive operations.

${colors.bright}SAFETY FEATURES:${colors.reset}
  ✓ Dry-run mode to preview changes
  ✓ Interactive confirmations for dangerous operations
  ✓ Only targets safe cache and temporary files by default
  ✓ Warnings before destructive operations
  ✓ Skips system files and user documents

${colors.bright}STANDARD CLEANUP (SAFE):${colors.reset}

${colors.green}Trash${colors.reset}
  • Empties ~/.Trash folder
  • Safe to delete
  • Can free: 0-5GB

${colors.green}Homebrew Cache${colors.reset}
  • Removes downloaded packages and old versions
  • Safe to delete - can be re-downloaded
  • Can free: 0.5-2GB

${colors.green}Application Caches${colors.reset}
  • Safari, Chrome, VSCode, pip, yarn caches
  • Safe to delete - applications will rebuild
  • Can free: 1-5GB

${colors.green}npm & Yarn Caches${colors.reset}
  • Removes cached packages
  • Safe to delete - packages re-download on install
  • Can free: 0.5-2GB

${colors.green}Old Logs${colors.reset}
  • Removes .log files older than 30 days
  • Safe to delete
  • Can free: 100MB-1GB

${colors.green}Xcode DerivedData${colors.reset}
  • Build artifacts and indexes
  • Safe to delete - Xcode will rebuild
  • Requires confirmation
  • Can free: 5-20GB

${colors.bright}DEEP CLEANUP (REQUIRES CONFIRMATION):${colors.reset}

${colors.red}node_modules Folders${colors.reset}
  • ⚠️  WARNING: Removes ALL node_modules in your home directory
  • Shows list before deletion
  • Run 'npm install' to restore in projects
  • Can free: 5-50GB for developers

${colors.red}Docker Images & Containers${colors.reset}
  • ⚠️  WARNING: Removes unused Docker resources
  • May remove images you need
  • Requires confirmation
  • Can free: 1-10GB

${colors.red}CocoaPods Cache${colors.reset}
  • Removes cached iOS dependencies
  • Requires confirmation
  • Can free: 0.5-5GB

${colors.red}Gradle Cache${colors.reset}
  • Removes Android build caches
  • Requires confirmation
  • Can free: 1-10GB

${colors.red}Xcode Archives${colors.reset}
  • ⚠️  WARNING: Contains app builds for distribution
  • CANNOT be recovered once deleted
  • Only delete if you have backups
  • Requires confirmation
  • Can free: 5-50GB

${colors.bright}BEST PRACTICES:${colors.reset}
  1. Always run with --dry-run first
  2. Review what will be deleted
  3. Start with standard cleanup
  4. Only use deep cleanup when desperate for space
  5. Keep backups of important data
  6. Run standard cleanup monthly

${colors.bright}COMMON WORKFLOWS:${colors.reset}

${colors.cyan}Quick Monthly Cleanup:${colors.reset}
  $ clean-disk-space --yes

${colors.cyan}When Low on Disk Space:${colors.reset}
  $ clean-disk-space --dry-run
  $ clean-disk-space
  $ clean-disk-space deep --dry-run
  $ clean-disk-space deep

${colors.cyan}Before Major OS Update:${colors.reset}
  $ clean-disk-space deep --dry-run
  $ clean-disk-space deep

${colors.bright}TROUBLESHOOTING:${colors.reset}

${colors.yellow}Q: How much space will I free?${colors.reset}
A: Standard: 2-10GB, Deep: 10-50GB+ (varies by usage)

${colors.yellow}Q: Is it safe to delete node_modules?${colors.reset}
A: Yes, but you'll need to run 'npm install' in projects again

${colors.yellow}Q: Can I recover deleted files?${colors.reset}
A: No, deletions are permanent. Use --dry-run to preview first

${colors.yellow}Q: Will this break my apps?${colors.reset}
A: No, we only delete caches and build artifacts that can be regenerated

${colors.yellow}Q: What if I need more space?${colors.reset}
A: Consider external storage or cloud services for large files

${colors.bright}SYSTEM REQUIREMENTS:${colors.reset}
  • macOS (tested on 10.15+)
  • Node.js >= 12.0.0
  • Terminal/Shell access

${colors.bright}LEARN MORE:${colors.reset}
  GitHub: https://github.com/yourusername/clean-disk-space
  Issues: https://github.com/yourusername/clean-disk-space/issues

${colors.gray}Run 'clean-disk-space help' to see usage examples${colors.reset}
`;

const args = process.argv.slice(2);
const command = args.find(arg => !arg.startsWith('-'));

const options = {
  dryRun: args.includes('--dry-run') || args.includes('-d'),
  yes: args.includes('--yes') || args.includes('-y'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h')
};

if (options.help || command === 'help') {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (command === 'docs' || command === 'doc') {
  console.log(DOCS_TEXT);
  process.exit(0);
}

const cleaner = new DiskCleaner(options);

if (command === 'deep') {
  cleaner.runDeepClean().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
} else {
  cleaner.run().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}
