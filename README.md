# Next.js + TypeScript Starter

This repo is a minimal Next.js app using the App Router and TypeScript.

## Requirements

- Node.js 18.17+ (or 20+ recommended)
- A package manager: npm (default), yarn, or pnpm

## Setup

Install dependencies (using npm by default):

```bash
npm install
```

Or with yarn:

```bash
yarn
```

Or with pnpm:

```bash
pnpm install
```

## Scripts

- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — build for production
- `npm run start` — run production server
- `npm run lint` — run ESLint

## Project Structure

- `app/` — App Router entry (`layout.tsx`, `page.tsx`)
- `app/globals.css` — global styles
- `public/` — static assets
- `next.config.ts` — Next.js config (TypeScript)
- `tsconfig.json` — TypeScript config
- `.eslintrc.json` — ESLint config

## Notes

- Strict mode and typed routes are enabled.
- Adjust `package.json` to your preferred package manager if needed.

