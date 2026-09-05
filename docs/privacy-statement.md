# Privacy Statement (draft)

Source of truth for `apps/excel-addin/public/privacy.html`. Fill in the
bracketed placeholders before publishing or submitting to AppSource; this file
and the HTML page should stay in sync.

**Publisher:** [PUBLISHER / COMPANY NAME]
**Contact:** [SUPPORT EMAIL]
**Last updated:** [DATE]

## What Formula in Action is

Formula in Action is a Microsoft Excel add-in that explains the formula in your
selected cell in plain language, with a step-by-step breakdown, a real-world
example, and any risks or improvements it can detect.

## What we send, and what we never send

When you select a formula and open the task pane, we send **only**:

- the text of the formula itself (e.g. `=IFERROR(A2/B2,0)`)
- the address of the selected cell (e.g. `Sheet1!C2`)
- the names of the sheets and named ranges that formula references
- your chosen explanation mode and example context

We **never** send: cell values, other cells, the surrounding worksheet, the
workbook file, your name, your email, or any other document content. Reading
the current file, workbook, or any other files on your device is not something
this add-in does.

## Where that data goes

The formula and metadata above are sent, over HTTPS, to our explanation
service, which:

1. Runs it through a deterministic analysis (no AI, no network call) to
   identify functions, references, and risks.
2. Sends the analysis — not a screenshot, not the workbook — to Anthropic's
   Claude API to generate the plain-language explanation and illustrative
   example.
3. Returns the result to your task pane. **Nothing is stored** after the request
   completes — there is no formula history or database in this version.

See Anthropic's own privacy policy for how they handle API requests:
https://www.anthropic.com/legal/privacy

## Anonymous usage statistics (optional, off by default)

If you turn on "Share anonymous usage stats" in the pane's settings, we record
a small number of anonymous events (pane opened, mode changed, an explanation
was shown or failed, a suggestion was copied) together with: the explanation
mode, the example context, whether the result was degraded (offline), and
counts of warnings/functions. This is tied to a random id that resets every
time you reopen the pane — **never to your identity, your device, or your
formula**. It is off until you turn it on, and you can turn it off again at
any time in the same settings panel.

## Data retention

We do not retain formulas, explanations, or (when enabled) usage events beyond
what is needed to serve the request and, for usage events, aggregate anonymous
metrics. There is no user account and nothing is linked to your Microsoft
identity.

## Your choices

- Anonymous usage stats: off by default; toggle any time in the pane's
  Settings (gear icon).
- You can stop using the add-in and remove it from Excel at any time
  (Insert → My Add-ins → Manage → Remove), which stops all data flow
  immediately.

## Contact

Questions or requests about this statement: [SUPPORT EMAIL].
See also [support.html](../apps/excel-addin/public/support.html) for general help.
