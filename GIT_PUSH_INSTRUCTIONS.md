# Push WalleOS to GitHub

Follow these steps to push your code to https://github.com/brownzinoart/walleOS.git

## Step 1: Initialize Git (if not already done)

```bash
cd /Users/wallymo/WalleOS
git init
```

## Step 2: Add all files

```bash
git add .
```

## Step 3: Create initial commit

```bash
git commit -m "Initial commit: Terminal-inspired AI portfolio with Next.js 15"
```

## Step 4: Add GitHub remote

```bash
git remote add origin https://github.com/brownzinoart/walleOS.git
```

## Step 5: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

## Troubleshooting

### If remote already exists:
```bash
git remote remove origin
git remote add origin https://github.com/brownzinoart/walleOS.git
```

### If you need to force push (use with caution):
```bash
git push -u origin main --force
```

### If you get authentication errors:
- Make sure you're logged into GitHub
- You may need to use a Personal Access Token instead of password
- Or use SSH: `git remote set-url origin git@github.com:brownzinoart/walleOS.git`

## Verify

After pushing, visit https://github.com/brownzinoart/walleOS to see your code!

## Next Steps

1. Set up Netlify deployment (see README.md)
2. Enable GitHub Actions for CI/CD (optional)
3. Add branch protection rules (optional)

---

**Note**: The .gitignore file is already configured to exclude:
- node_modules/
- .env files
- .next/ build output
- OS-specific files (.DS_Store, etc.)
