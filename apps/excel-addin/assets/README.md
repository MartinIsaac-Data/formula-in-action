# assets/

Ribbon and store icons, served from `<BASE_URL>/assets/`.

`icon-16.png`, `icon-32.png`, `icon-64.png`, `icon-80.png` are **1×1 placeholder
PNGs**. Regenerate solid-colour placeholders with:

```bash
node assets/make-icons.mjs
```

Replace all of them with real artwork (transparent PNG, exact pixel sizes)
before an AppSource submission. AppSource also wants a 128×128 and store imagery.
