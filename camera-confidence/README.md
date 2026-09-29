# VERA — On-Camera Coaching Engine

An on-camera performance coach that measures what you actually do — gaze, blink rate,
gesture placement, pitch range, pacing, disfluency — and prescribes drills against it.
Twenty-one drills from "cannot press record" to broadcast crisis recovery, plus a learning
layer that works out which drills move *your* numbers and invents new ones when nothing does.

## Privacy

**Raw video and audio never leave your device.** Sensing runs client-side in WASM; only
derived numbers cross the wire. This is enforced by a test (`tests/privacy.test.mjs`) that
statically asserts no sensing module contains network egress and that the telemetry vector
carries nothing but numbers.

## What it measures

Eight dimensions, with the documented target ranges:

| Dimension | Target | Deficient | Over-corrected |
|---|---|---|---|
| Speaking pace | 130–150 WPM | >170 rushing | <105 stall |
| Filler density | <1.3% | >4.5% | 0% robotic |
| Lens fixation | 65–80% | <45% evasive | >95% stare |
| Blink rate | 12–22/min | >38 stress flutter | <6 freeze |
| Pitch range | ≥2.5 semitones | <1.2 monotone | erratic |
| Terminal inflection | falling | rising (uptalk) | clipped |
| Gesture occupancy | 20–40% TruthPlane | hands below frame | flailing |
| Head tilt | 5–12° | rigid | slouched |

## The ladder

| Stage | Focus |
|---|---|
| 0 | Baseline — a kept recording and three things you believe. No gating. |
| 1 | Autonomic regulation and lens desensitization |
| 2 | Spatial framing, TruthPlane gestures, warmth and competence |
| 3 | Prosody, message architecture, hedging |
| 4 | Teleprompter fluency |
| 5 | Crisis bridging, blunder recovery, long-form stamina |

Graduation requires benchmarks held across **three consecutive sessions**, never one good take.

## The learning layer

The curriculum is a starting point, not a ceiling.

1. **Learn what works on you.** Every drill accumulates per-metric effect evidence from
   within-session pre/post measurements. Selection is Thompson sampling weighted to your
   weakest dimension.
2. **Generate when stuck.** If a metric stalls and nothing in the registry helps, VERA
   authors a new drill to schema.
3. **Research beyond the manual.** Search out external technique, map it to the schema,
   record the source.

**What makes this learning rather than accumulation:** generated and researched drills are
pruned when they fail to earn their place. Documented drills are never auto-pruned — a drill
failing for one speaker is not evidence against the curriculum.

The statistics are the hard part. With one speaker and noisy telemetry, attributing a change
to a drill is confounded by warm-up, fatigue and natural improvement. Three defences:
within-session pre/post so day-to-day variance cancels, shrinkage toward a no-effect prior
so two lucky sessions cannot manufacture a finding, and a minimum trial count before anything
influences selection or pruning.

The claim is tested, not asserted: `tests/core.test.mjs` runs a simulation with synthetic
speakers of known ground-truth drill effects and asserts the bandit converges on the drill
that genuinely works while pruning the inert ones.

## Layout

```
registry/drills.json     21 drills: metrics, graduation predicates, protocols, cues
app/sensing/             vision.mjs, audio.mjs (pure math) + pipeline.mjs (MediaPipe wiring)
app/scoring/score.mjs    composite confidence score, graduation predicates
app/learning/efficacy.mjs  effect estimation, Thompson selection, pruning
server/tools.mjs         VERA's 8 tools + proposed-drill validation
SKILL.md                 VERA's coaching brain, usable directly as a Claude skill
docs/PROVENANCE.md       every departure from the source documents, and why
index.html               the Stage 0–1 on-ramp, self-contained and offline
```

## Tests

```
node tests/run.mjs
```

183 tests across four suites: scoring and learning (77), sensing against synthesized
ground-truth signals (65), the privacy invariant (20), tool schemas (21).

## Honesty

Stage 4–5 coach prompts are **authored**, not transcribed — the supplied manual truncates
mid-Stage 4. Gaze is an uncalibrated approximation. Three source conflicts were resolved in
favour of the operational document. All of it is recorded in `docs/PROVENANCE.md`.
