# Fonts

Self-hosted woff2 files, generated from the Google Fonts CSS (latin and latin-ext subsets only). The `@font-face` rules
that name them are at the top of `web/assets/styles.css`.

They are served from this origin rather than `fonts.gstatic.com` because a third-party font is a third-party dependency
in three ways that matter here: it widens the `font-src`/`style-src` the Content-Security-Policy has to allow, it leaks
every visitor to another origin, and its CORS policy is not ours to fix — Google's CDN rejects the preflight that a
signed-agent request (`signature-agent`, Web Bot Auth) triggers, so the fonts failed to load for exactly the automated
clients this site wants to serve well.

| Family                  | Weights              | Licence                   |
| ----------------------- | -------------------- | ------------------------- |
| IBM Plex Sans Condensed | 400, 500, 600, 700   | SIL Open Font License 1.1 |
| IBM Plex Serif          | 400, 400 italic, 600 | SIL Open Font License 1.1 |
| IBM Plex Mono           | 400, 600             | SIL Open Font License 1.1 |
| Courier Prime           | 400, 700             | SIL Open Font License 1.1 |
| VT323                   | 400                  | SIL Open Font License 1.1 |

All five are OFL 1.1, which permits redistribution as part of this project. To refresh them, re-run the Google Fonts CSS
through the same subset filter and replace both the files and the `@font-face` block.
