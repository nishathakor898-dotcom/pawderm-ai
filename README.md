# PawDerm AI

A static PawDerm AI product site with detailed pages and a client-side pet skin checker demo.

## What Is Included

- Long product homepage with live sample demo and upload checker
- Separate pages: pricing, docs, blog, contact, terms, regulatory, and login
- Contact page with placeholder email, support email, phone, and address
- Visual-only contact and login forms
- Static Vercel deployment setup with clean URLs

## Run Locally

If `npm` is installed:

```bash
cd "/Users/prakashthakor/Downloads/any /1"
npm run dev
```

This environment does not currently expose `npm`, so use bundled Node:

```bash
cd "/Users/prakashthakor/Downloads/any /1"
/Users/prakashthakor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/dev.mjs
```

Open:

```text
http://localhost:4173
```

## Build

```bash
cd "/Users/prakashthakor/Downloads/any /1"
/Users/prakashthakor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build.mjs
```

The production files are generated in `dist/`.

## GitHub + Vercel Go Live

1. Create a GitHub repository.
2. Upload the project files to the main level of the repo.
3. In Vercel, import the GitHub repo.
4. Use:

```text
Framework Preset: Other
Build Command: node scripts/build.mjs
Output Directory: dist
```

5. Deploy.

## Files

- `index.html` - homepage
- `pricing.html`, `docs.html`, `blog.html`, `contact.html`, `terms.html`, `regulatory.html`, `login.html` - separate pages
- `styles.css` - responsive UI styles
- `app.js` - demo, modal, visual form, and checker behavior
- `content-defaults.js` - default site content object
- `content.js` - public content hydration
- `scripts/dev.mjs` - local dev server with clean URLs
- `scripts/build.mjs` - static build into `dist/`
- `vercel.json` - Vercel build and clean URL configuration
