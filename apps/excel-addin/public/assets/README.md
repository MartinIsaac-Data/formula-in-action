# public/assets/

Ribbon and store icons. Lives under `public/` so Vite serves it verbatim at
`<BASE_URL>/assets/...` in both dev and the built `dist/` — this path must match
`manifest.template.xml`'s `bt:Image` / `IconUrl` references exactly.

`icon-16.png`, `icon-32.png`, `icon-64.png`, `icon-80.png` are **1×1 placeholder
PNGs**. Regenerate solid-colour placeholders with:

```bash
node public/assets/make-icons.mjs
```

Replace all of them with real artwork (transparent PNG, exact pixel sizes)
before an AppSource submission. AppSource also wants a 128×128 and store imagery.
