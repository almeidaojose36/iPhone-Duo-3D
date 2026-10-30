# iPhone Duo film: handoff

**Updated:** 30 Oct 2026 (revision spec applied, renders pending)

The film **"Inside the iPhone Duo"** is rendered at 1080p30, 15:24 long (589 MB). The master is `video/duo/full/inside_the_iphone_duo_review.mp4`.

The film is an educational teardown in the same style as the PC film. It explains how the phone works and does not hunt for faults. The iFixit teardown and the reference review are guidelines only.

## Chapters
```
0:00 The fold
2:03 The hinge
5:11 The screen
7:47 Two batteries
9:22 The brains
11:32 Cameras
13:22 Sound and touch
14:18 Outro
```
The same list is saved in `full/youtube_chapters.txt`.

## Where things live
| What | Path |
| --- | --- |
| 3D models (.glb + `model.js`) | `models/iPhone_Duo*` (phone, Star White, Hinge, Batteries, Logic_Board, Cameras, Inner_Display, Sound_Touch) |
| Script (v3, about 2,300 words) | `video/duo/script.md` → `tools/split_script.py` → `beats.json` |
| Chapter projects (HyperFrames 0.8.193) | `video/duo/c1` … `c8` (`assets/js/shots.js`, `cues.py`, `assets/vo/`) |
| Shared JS | `video/duo/shared/js/` (`duo.js`, `microduo.js`, `overlays.js`). The engine and `fx.js` are symlinked from `video/pilot` |
| Notes from the reference review | `video/duo/reference_review_takeaways.md` |
| Publishing notes | `video/duo/publishing.md` |

## Pipeline
1. **Build a model:** `node tools/build-model.mjs models/<Name>/model.js`. The Star White model is a copy of `iPhone_Duo/model.js` with the `FINISH` constant and the title changed.
2. **Record the voiceover:**
   - `tools/record.sh` records with Kokoro, voice am_michael, at speed 1.03, normalised to −17 LUFS.
   - parakeet-mlx gives the word timings.
   - `make_vo_js.py` writes the timings for the chapter.
   - Spellings that change pronunciation go in the lexicon in `vo.py` (for example A20 → `A-20`).
3. **Check a still:** run this inside a chapter folder:
   ```
   npx --yes hyperframes@0.8.193 snapshot . --at 65 --no-end --timeout 40000 --describe false -o renders/snapX
   ```
4. **Render and assemble:** `zsh tools/render_reviews.sh` renders every chapter that has no `review_cN.mp4` yet. `tools/assemble.py review` then levels the audio to −14 LUFS and writes `full/`. **To re-render a chapter, delete its `review_cN.mp4` first.**

## Gotchas
- **Disk space** is the main risk. Free space was about 1.5 GB at the end of this session. Renders fail with "Low disk space" below about 1 GB. Browser caches can be cleared. Ask before touching user files; the best candidate is the PC film's `video/chapters_4k` at 4.1 GB.
- **The engine dulls metal.** The PC engine raises metal roughness to at least 0.42. `duo.js` `loadDuo` lowers it again for the titanium frame, hinge cover, lens rings, Camera Control, Touch ID button and Apple logo, so they keep their premium shine.
- **Thin printed layers** (screen images, decals, the crease) need `polygonOffset` and no shadows, otherwise they shimmer. This is already handled in `loadDuo`. The camera near plane is 0.5.
- **Visual timing** is keyed to words with `at(beat, word)`. The words are cleaned to `[a-z0-9]`, so "teardrop-shaped" becomes `teardropshaped`. If the script changes, check the keys.
- **Render only after changes are agreed with the user.**

## Model state (v3)
- Two finishes: Night Sky and Star White.
- A pill-shaped camera bar with two large lenses in polished rings.
- A glossy Apple logo decal on the back.
- Volume buttons on the top edge.
- A D-shaped outer screen with a vertical camera pill at the top right.
- Fold pivots `Fold_Pivot_Left` and `Fold_Pivot_Right`. The studio has a Fold slider.
- The inner display has ultra-thin glass layers above and below the OLED.

## Revision spec applied (30 Oct), not rendered yet
The source has every fix from the revision spec, but the renders and `full/` are still the old cut.
- **c1:** new intro hook (o2); "Closed, it's" re-recorded with a 0.15 s pause (`[0.15]` pause markers in the `vo.py` lexicon); flipped phone settles near the floor under the comparison card. c1 is 3.0 s longer.
- **c2:** "Center support bar"; teardrop loop raised 4 mm into the spine and 4 mm in from the end (`TD_UP`, `TD_IN`).
- **c3:** "Color filters + black grid", "COLOR FILTERS".
- **c5:** "files live" spoken /lɪv/ (lexicon `files liv`). c5 is 0.07 s shorter.
- **c6:** "Color filter" pill; end bumper NEXT: SOUND & TOUCH; the dual camera module lifts out of its housing 1:1, then turns and moves to the row.
- **All chapters (`duo.js`):** the hinge cover is 3.5% shorter so its ends don't show past the frame. Only visible when re-rendered.
- **Not changed:** the tent-mode Apple logo (c6 k9) is fixed to the back glass and already lies sideways in tent mode, which is correct.
- **Open question:** c7's end card says "NEXT: THE JOURNEY", but c8 is called "Outro".

**To render** (on the Mac, in `video/duo`): delete `review_c1/c2/c3/c5/c6.mp4` from each chapter's `renders/` folder, then run `zsh tools/render_reviews.sh`. That also reassembles `full/` and rewrites `full/youtube_chapters.txt`. Copy the new chapter list into `publishing.md` and the list at the top of this file. Expect every chapter after c1 to start about 3 s later. Rendering in a cloud container has no GPU: about 3 s a frame, 9–18 hours for these five chapters.

## Still to do
1. Render the five changed chapters (above) and update the chapter lists.
1. Make the 4K60 masters. This needs 6–8 GB or more of free space.
2. Cut the Shorts.
3. Make the thumbnail. **Ask the user about branding taste first.** The user makes logos and banners themselves; give them prompts.
4. Optional: a Cycles thumbnail or hero shot in Blender, after the chapters are locked.
