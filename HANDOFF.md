# iPhone Duo film: handoff

**Updated:** 30 Oct 2026

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

## Still to do
1. Make the 4K60 masters. This needs 6–8 GB or more of free space.
2. Cut the Shorts.
3. Make the thumbnail. **Ask the user about branding taste first.** The user makes logos and banners themselves; give them prompts.
4. Optional: a Cycles thumbnail or hero shot in Blender, after the chapters are locked.
