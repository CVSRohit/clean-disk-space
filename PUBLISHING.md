# Publishing Guide

## Pre-Publishing Checklist

Before publishing to npm, complete these steps:

### 1. Update package.json

Update the following fields in [package.json](package.json):

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/clean-disk-space.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/clean-disk-space/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/clean-disk-space#readme"
}
```

### 2. Test Locally

```bash
# Test dry run
npm test

# Test deep cleanup dry run
npm run test:deep

# Link globally and test
npm link
clean-disk-space --dry-run
clean-disk-space deep --dry-run
clean-disk-space help
clean-disk-space docs
```

### 3. Initialize Git Repository (if not done)

```bash
git init
git add .
git commit -m "Initial commit: clean-disk-space CLI tool"
```

### 4. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `clean-disk-space`
3. Don't initialize with README (we already have one)
4. Push your local repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/clean-disk-space.git
git branch -M main
git push -u origin main
```

### 5. Login to npm

```bash
npm login
# Enter your npm username, password, and email
```

### 6. Check Package Name Availability

```bash
npm search clean-disk-space
```

If the name is taken, update the `name` field in package.json to something unique like:
- `@yourusername/clean-disk-space`
- `macos-disk-cleaner`
- `disk-space-cleanup-tool`

### 7. Dry Run Publish

Check what will be published:

```bash
npm pack --dry-run
```

This shows you exactly what files will be included.

### 8. Publish to npm

```bash
# First time publish
npm publish

# If using scoped package (starts with @)
npm publish --access public
```

### 9. Verify Publication

```bash
# Check on npm
npm view clean-disk-space

# Test installation
npm install -g clean-disk-space
clean-disk-space --help
```

## Post-Publishing

### Update Version

When making changes, update the version:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Then publish
npm publish
```

### Add npm Badge to README

Add this to your README.md:

```markdown
[![npm version](https://badge.fury.io/js/clean-disk-space.svg)](https://www.npmjs.com/package/clean-disk-space)
[![npm downloads](https://img.shields.io/npm/dm/clean-disk-space.svg)](https://www.npmjs.com/package/clean-disk-space)
```

## Troubleshooting

### Package name already exists
- Use a scoped package: `@yourusername/clean-disk-space`
- Choose a different name

### 403 Forbidden
- Make sure you're logged in: `npm login`
- Check you have permission to publish

### Files missing from package
- Check `.npmignore` and `files` field in package.json
- Use `npm pack --dry-run` to preview

## Maintenance

### Regular Updates
1. Monitor GitHub issues
2. Update dependencies regularly
3. Test on latest macOS versions
4. Keep documentation up to date

### Best Practices
- Use semantic versioning
- Write clear commit messages
- Tag releases in git
- Keep a CHANGELOG.md

## Current Status

✅ Package ready to publish
✅ Tests passing
✅ Documentation complete
✅ CLI working locally

**Next Steps:**
1. Update author info in package.json
2. Create GitHub repository
3. Run `npm publish`
