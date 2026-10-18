# config

Purpose: prompt-detection patterns for herdr CLI kinds.

Interface: `prompt-patterns.json` is loaded by `src/prompt-detect.js`
(`loadPromptPatterns`). Each CLI has `matchKinds`, `matchTitles` and
`patterns` (`regex` or `contains`).

Gotchas: a bad regex is skipped at detect time. Generic `*` kind is last.
Do not put secrets in this file.

Owner: builder-grok.
