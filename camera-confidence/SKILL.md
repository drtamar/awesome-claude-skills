---
name: camera-confidence
description: A rep-based training program for getting comfortable on camera, built for people starting from zero. Use when someone wants to start a YouTube channel, present on video, or overcome camera anxiety — especially when the hesitation is partly about not trusting their own opinions, not just about being filmed.
---

# Camera Confidence

An interactive training program for going from zero on-camera confidence to publishing.
Open `index.html` — it is self-contained, works offline, and saves progress locally.

## The premise

Most on-camera advice treats the problem as desensitization: get used to the lens and
the awkwardness fades. That is only half of it. A large share of people who freeze on
camera also hedge in writing — they are not sure their take is worth stating. Train only
the exposure half and you produce someone comfortable being filmed who still has nothing
they will commit to saying.

So the program runs two tracks at once:

- **Exposure** — being seen. Mirror talk, record-and-delete, progressively longer takes.
- **Conviction** — having a position and holding it. One-sentence takes, the "actually"
  drill, defending a claim for thirty seconds with hedge words banned.

Neither works alone. Conviction drills done off-camera don't transfer to being filmed;
exposure drills with nothing to say build a confident delivery of nothing.

## Design decisions worth keeping

**Reps, not weeks.** Calendar-labeled programs ("Week 1", "Week 2") manufacture a failure
state. Miss two days and you are behind, and being behind is the most common reason people
quit. Stages here advance on reps logged.

**Rep counters, not checkboxes.** Most exercises are repeated practice — "five times",
"ten times". A checkbox lets someone mark a recurring habit complete after one session.

**The froze button.** Every exercise offers *Logged it* and *Froze — log it anyway*. Both
count. Freezing on camera is the thing being trained out; it cannot be trained without
being met. Froze reps collect in a log the user reads back later, which is where the
progress actually becomes visible.

**Nothing is hard-locked.** Later stages are marked "not yet" but still open. Gating by
force adds shame to a program whose whole subject is self-consciousness.

**One kept baseline.** The first recording goes to a Vault, unwatched. Everything else in
early exposure work is deleted unwatched. Without that one saved file there is no honest
before-and-after later.

## Stages

| Stage | Focus | Reps |
|---|---|---|
| 0 | Baseline — one recording to the Vault, three beliefs written down | 2 |
| 1 | Desensitize — kill the flinch, find out you have takes | 28 |
| 2 | Hold a line — longer takes, hedging banned | 19 |
| 3 | Presence — three-minute takes, format probe, publish one | 8 |
| Ongoing | Maintenance — daily rep, vault review, froze-log review | — |

The format probe in Stage 3 records one topic twice, once face-to-camera and once as a
structured explainer, because which format suits someone is discovered by doing, not decided
in advance.

## Technical

Single HTML file. No build, no dependencies beyond Google Fonts. Progress persists in
`localStorage`, every access wrapped so the page still works when storage is blocked.
Light and dark themes; phone-first layout.
