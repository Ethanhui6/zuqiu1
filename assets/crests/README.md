# Crest provenance

No unverified remote crest hot-links are shipped. The current club database
uses `src/components/clubCrest.js` to render a deterministic, project-authored
initials badge when a licensed local crest is unavailable. It preserves the
club name, keeps a fixed aspect ratio, uses `object-fit: contain` for future
local files, and falls back to `placeholder.svg` on load failure.

This is an explicit generated fallback, not an imitation of an official crest.
Future licensed additions must record the club, filename, source URL, provider,
license, and retrieval date in this file before being used in production.
