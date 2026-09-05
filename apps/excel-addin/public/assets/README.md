# public/assets/

Ribbon and store icons. Lives under `public/` so Vite serves it verbatim at
`<BASE_URL>/assets/...` in both dev and the built `dist/` — this path must match
`manifest.template.xml`'s `bt:Image` / `IconUrl` references exactly.

`icon-16/32/64/80/128.png` are a hand-drawn placeholder: a Fluent-purple
rounded square with a white "=" mark, anti-aliased, transparent corners — no
image library, just raw PNG bytes (see `make-icons.mjs`). Regenerate with:

```bash
node public/assets/make-icons.mjs
```

Replace all of them with real artwork before an AppSource submission — this
is still a placeholder, just no longer a solid-colour square. AppSource also
wants store listing imagery beyond the manifest icons themselves.
