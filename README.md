# Math Galaxy

A space-themed math drill for kids. It teaches the arithmetic facts that have to
be memorised rather than worked out — the ones that make longer problems fast —
using spaced repetition, and wraps the practice in stars and rank-ups so it
feels like a game instead of a worksheet.

Everything runs in the browser. There is no account, no backend and no network
call; progress lives in `localStorage` on the device.

## The facts

393 facts across four families, each with its own difficulty ordering that
decides what gets introduced next.

| Family         | Range                                     | Facts |
| -------------- | ----------------------------------------- | ----- |
| Addition       | `1 + 1` … `9 + 9`, commutative-deduped    | 45    |
| Subtraction    | minuend to 18, subtrahend to 9            | 126   |
| Multiplication | `1 × 1` … `12 × 12`, commutative-deduped  | 78    |
| Division       | the times table backwards, dividend ≤ 144 | 144   |

Subtraction is the set that shows up column-by-column inside bigger problems —
`15 − 9`, `18 − 7`. Facts that bridge ten are ranked hardest and introduced
last; `− 1`, partners of ten and clean teens come first. Addition leads with the
`+ 1` family, then doubles and make-ten. Multiplication and division share an
easiest-factors-first ordering (`1, 2, 10, 5, 11, 3, 4, 9, 6, 7, 8, 12`).

## Modes

Seven, chosen on the home screen: each family on its own, **Add & Sub**, **Mul &
Div**, and **Everything**. The paired modes interleave evenly, because each
family's introduction order restarts at zero.

An **"I already know these"** switch skips the *New Fact!* cards and puts the
whole pool in play from the first question — for a player who wants drilling
rather than teaching. Mastery still tracks from their answers either way.

## How the practice works

Each fact sits in one of six Leitner-style boxes, from *not introduced* through
*learning* up to *mastered*. A right answer moves it up a box; a wrong one drops
it straight back to *learning*.

Which fact comes next is a weighted random draw. Weight falls off sharply with
the current correct-streak — a fact answered right three times running is about
64× less likely to appear than one at zero — with a boost for anything not seen
in a minute, and a further boost for a fact that has been attempted and missed.
The immediately preceding fact is excluded so nothing repeats back to back.

New facts are introduced one at a time, and only once nothing is currently being
struggled with, so the active set stays small enough to actually learn.

Correct answers earn stars, worth more on a streak (1 → 2 at three in a row →
3 at five → 5 at ten). Stars accumulate into eight ranks, Space Cadet through
Universe Master. The running streak count is deliberately hidden from the
player: seeing it climb made getting one wrong feel like a loss.

The **Progress Map** has a grid per family, colour-coded by box. Division's grid
is the times-table shape with rows as the quotient and columns as the divisor,
so each of its 144 cells is exactly one fact.

## Running it

Requires Node 22 (see `.node-version`).

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the build
npm run lint     # eslint
```

## Layout

```
app/        Next.js App Router entry, global styles, fonts
components/ HomeScreen, QuizScreen, ProgressScreen, Stars backdrop
lib/
  types.ts    fact and game-state shapes, modes, ranks
  engine.ts   fact catalogue, difficulty ordering, selection, scoring
  storage.ts  localStorage persistence and save migration
```

Saves are rebuilt from the current catalogue on every load and merged by fact
key, so adding facts or a whole new family never invalidates a player's
progress.

Built with Next.js 16, React 19, TypeScript and Tailwind 4. The single route is
statically prerendered, and it deploys to Vercel (see `vercel.json`).
