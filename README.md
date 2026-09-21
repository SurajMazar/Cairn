# Cairn

A personal library for the web.

A cairn is the pile of stones you leave on a trail so you can find your way back.
That is what this is: you save the websites worth returning to, file them under a
category and tags, write notes about why they mattered, and find them again later
by anything you wrote, not just by what they were called.

Everything runs in the browser. There is no backend, no database, no account and
no API. Your library lives in `localStorage` on the device you saved it from.

![The library, home and detail views](#)

## Running it

```bash
npm install
npm run dev
```

Open the address Vite prints, `http://localhost:5173` by default.

```bash
npm run build      # type check, then build into dist/
npm run preview    # serve the built output
npm run typecheck  # types only
```

Requires Node 18 or newer.

## Deploying

The build is a folder of static files, so any static host will serve it.

**Vercel.** Import the repository and deploy. The Vite preset is detected
automatically, and [`vercel.json`](vercel.json) pins the rest: `npm run build`
into `dist`, immutable caching for the content-hashed assets, no caching for the
service worker and manifest so a new deploy is picked up immediately, and a
catch-all rewrite to `index.html`.

Routing uses the URL hash, so deep links such as `/#/bookmarks/abc` never reach
the server and work on any host, rewrite rules or not. The rewrite is there so
the app keeps working if you ever switch to `BrowserRouter`.

**Anything else.** Serve `dist/` as-is. No environment variables, no build-time
secrets, nothing to configure.

## How it is put together

```
src/
  storage/     persistence: versioned envelopes, validation, import/export
  context/     library state and actions, plus dialogs and toasts
  lib/         search, sorting, URL handling, time formatting, site directory
  components/  shell, collection views, dialogs, form controls
  pages/       one file per route
  styles/      design tokens, base styles, shared CSS module primitives
```

React, TypeScript and CSS Modules on Vite. No UI framework, no state library, no
CSS framework.

Nothing outside `src/storage` touches `localStorage`. Reads go through a
normaliser that turns anything at all, including corrupted or hand-edited JSON,
into valid records or drops them, so a bad value can never break a render.
Stored payloads are wrapped in `{ version, data }` to leave room for migrations.

The storage keys are prefixed `weblibrary.` for historical reasons and are
deliberately frozen. Renaming them would orphan every library already saved in
someone's browser.

## Behaviour worth knowing

**Three timestamps, kept separate.** `createdAt` is when you first saved a
website. `updatedAt` moves whenever you change the website or any of its notes.
`lastVisitedAt` moves when you open it. Reading something is not editing it, so
opening a website never reorders Recently updated.

**Sorting is presentation only.** Changing the sort order never rewrites the
stored collection. Recently updated is the default, which keeps whatever you last
worked on at the top, and writing a note on a year-old bookmark brings it back.

**Search covers notes.** A query has to match every term, but the terms can land
in different fields, so a bookmark can be found through a note even when you have
forgotten its title. Searching `background processing` finds the MDN bookmark
annotated with a note about Web Workers.

**Embedding.** Many websites send headers refusing to be framed, and a page
cannot reliably detect that refusal from the outside: the browser fires `load`
either way and keeps the frame cross-origin, so there is nothing to read. The Web
view checks a list of the usual offenders up front, shows a panel with a way out
instead of an empty rectangle, and always keeps "Open in a new tab" visible for
the cases the list misses. Saving to your library works either way.

**Web search.** Without a server there is no way to read a search engine's
results page. Typing a query matches a small built-in directory of well known
sites for instant starting points, surfaces anything already in your library, and
offers the same query as a real search in a new tab.

**Favicons are opt-in.** Fetching them would tell a third party which sites you
have saved, so a letter mark is used until you turn the setting on in Settings.

**Offline.** A service worker caches the app shell, so Cairn opens with no
connection. Navigations go to the network first, so a new deploy is picked up
straight away. It is registered only in a production build, and registration
failures are swallowed: the app works fine without it.

## Your data

Settings has export, which writes everything to one JSON file, and import, which
validates the file first and then either merges it with what you have or replaces
everything. A merge matches bookmarks by id and then by URL, keeps whichever copy
was edited most recently, unions their notes so annotations are never lost, and
matches categories and tags by name so a merge does not leave you with "Design"
twice.

There is also a reset, behind a confirmation. Clearing site data for the page has
the same effect, so export if your library matters to you.
