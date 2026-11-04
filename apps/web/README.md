# The MoreAI MetaAgent web app

Clean architecture with MVVM, dependency injection and one app coordinator. `src/architecture.test.ts` checks these rules on every test run.

## Layers

```
src/
  main.tsx              Starts the app.
  app/                  The composition root and the coordinator. The only place that knows every feature.
  core/
    domain/             Pure rules and types, and the ports in ports.ts. No React, no browser.
    data/               The implementations of the ports. Only app/container.ts picks one.
    presentation/       What 2 or more features share on screen.
  features/<feature>/
    domain/             Rules only this feature needs.
    presentation/       The screen, its view model, its styles and its strings.
    previews.tsx        Every state of the screen, for the review page.
    index.ts            The feature's public API: the screen, its props and its previews.
```

## A screen

- `useXViewModel(ports)` holds the state and the actions, and never navigates.
- `XView` only draws a state it's given, so every state can be tested and previewed with no data behind it.
- `XScreen` joins the two. Its props are the ports it needs and a callback for each place it can lead to.
- `app/` turns those callbacks into navigation through the `AppCoordinator`.

## Rules

- No feature imports another. What 2 features share moves to `core/`.
- Only `app/container.ts` knows which data implementation runs, so the backend replaces the static demo data there and nowhere else.
- Every word on a screen comes from that screen's `strings.ts`, in English and Arabic. `catalogProblems` checks them.
- Money is whole piasters, formatted by `format.money`. Prices are never judged by the AI.
- Styles use the design system's tokens: no raw colors, curves, durations or pixel sizes.
- Small reading text never sits directly on the red ground, since it fails contrast there. It goes on a `Card`.
