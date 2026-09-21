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

## Installing it as an app

Cairn ships a manifest and a service worker, so a phone or desktop browser will
offer to install it. Installed, it opens in its own window with no browser
chrome and works with no connection.

The thing to know about an installed copy is what happens when you open a saved
website, because it is the one action that leaves the app:

- **New tab**, the default, hands the link to an in-app browser. On Android that
  is a Custom Tab, on current iOS an in-app web view. Both have a close or back
  control that returns you to Cairn exactly where you were.
- **Same window** navigates in place. You return with the system back gesture.
  This suits a phone if the in-app browser feels like too many layers.
- **Default browser** pushes the link out of the app container entirely. This is
  the one to pick if you run a content blocker: an installed web app is its own
  browser container, so Safari extensions and content blockers do not apply to
  anything it opens, and neither do your logins. There is no standard API for
  choosing a browser, so this uses `x-safari-https` on iOS and a package-less
  intent on Android, and falls back to opening the link in place if the system
  does not pick it up.

Settings has the choice, and says which one you are running under. Either way
nothing is at risk: the library lives in `localStorage`, so even a full reload
on the way back finds everything where you left it, including the visit that was
just recorded.

For sites that allow it, the Web view's embedded preview never leaves the app at
all, which is the smoothest option of the three on a phone.

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
results page, so a query goes straight out to a real browser tab rather than
being faked in-app. It is reachable in one action from the home field, from a
no-match result, from the mobile bar and from the Web view.

Google is the default. Worth knowing on a phone: the Google apps claim
`google.com/search` as a deep link, so the system can hand your search to the
app instead of a browser tab, and a web page has no way to refuse that. Settings
offers Brave Search, DuckDuckGo and Startpage, none of which are claimed by an
installed app.

**Opening links.** Every bookmark has Open, plus Copy link, Open in default
browser and Open in Brave behind the row's More menu.

A web page cannot choose which browser handles a link. All these actions can do
is ask the operating system to handle a browser-specific URL and see whether
anything claims it. Two constraints shape the implementation: the navigation has
to be top level and inside the user gesture, because both WebKit and Chromium
block custom schemes from the hidden iframe most snippets still use; and a
Chromium based browser refuses navigation to its own internal schemes from web
content, so `brave://` cannot work from inside Brave or Chrome on the desktop.
The Brave action is therefore hidden where it provably cannot work.

Success is not observable, so every handoff arms a fallback: if the page is
still in front a moment later, nothing claimed the link and it opens normally
instead. The action is never a no-op.

**Favicons are opt-in.** Fetching them would tell a third party which sites you
have saved, so a letter mark is used until you turn the setting on in Settings.

**Offline.** A service worker caches the app shell, so Cairn opens with no
connection. Navigations go to the network first, so a new deploy is picked up
straight away. It is registered only in a production build, and registration
failures are swallowed: the app works fine without it.

**Updates.** Each build is stamped with the commit it came from, and the service
worker is registered with that id in the URL. This is load bearing: the browser
decides whether a worker has changed by byte-comparing the script, and `sw.js`
is a static file whose contents are identical between builds, so without the id
no update is ever detected and the only way to get new code is to reinstall the
app. The id doubles as the cache name, so each build starts clean and the
previous one is dropped.

A new build installs in the background and then waits. Nothing is
swapped until you accept the prompt, because a worker that takes over
immediately can leave a half-updated app in front of someone mid-task. Accepting
hands over to the waiting worker and reloads once it is in control. Installed
copies re-check whenever you come back to the app, and Settings has a manual
check, alongside the installed build id and a force refresh that clears the
cache for a copy that is stuck.

**No third-party requests.** The webfonts are self-hosted from `public/fonts`,
so with the favicon setting off Cairn loads nothing from anyone else. That keeps
the typography intact offline, where the service worker only caches same-origin
requests, and behind a content blocker, where privacy filter lists routinely
block `fonts.googleapis.com`. It also means an ad blocker has nothing to block
in the app itself; what it filters is whatever you open from here.

## Your data

Settings has export, which writes everything to one JSON file, and import, which
validates the file first and then either merges it with what you have or replaces
everything. A merge matches bookmarks by id and then by URL, keeps whichever copy
was edited most recently, unions their notes so annotations are never lost, and
matches categories and tags by name so a merge does not leave you with "Design"
twice.

There is also a reset, behind a confirmation. Clearing site data for the page has
the same effect, so export if your library matters to you.
