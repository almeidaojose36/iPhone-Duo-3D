# Inside the iPhone Duo: production notes

Film 2 of Deep Teardown, built with the same pipeline as *Inside the Machine* (the PC film).

## Layout

| Path | What |
| --- | --- |
| `script.md` | Narration script (source of truth). `tools/split_script.py` writes each chapter's `assets/vo/beats.json`. |
| `c1` … `c8` | One HyperFrames project per chapter: cold open + The fold, The hinge, The screen, Two batteries, The brains, Cameras, Sound and touch, Outro (recap + 20 s end screen). |
| `cN/assets/js/shots.js` | The chapter's director: camera path, part motion, glows, labels and overlays, keyed to narration word times. |
| `cN/cues.py` | Sound-effect cues, score seed, swell times and tail length. |
| `shared/` | Shared assets: `js/duo.js` (model loader, fold rig, explode, orbit keys), `js/microduo.js` (micro worlds revealed through the loupe: GAA transistor, OLED subpixel, Li-ion cell, Hall sensor, image-sensor pixels, vapor chamber), plus bundled engine (`engine.js`, `fx.js`), fonts, vendor, SFX, and studio `.glb` models. Chapter assets link to this shared directory. |
| `tools/` | `record.sh` (Kokoro am_michael 1.03 → −17 LUFS → parakeet word timings), `make_vo_js.py`, `build_index.py` (stage + index + score), `score.py` (original synthesized score), `render_reviews.sh`, `assemble.py`. |
| `full/` | Assembled film and `youtube_chapters.txt`. |

## Clone this repository

Videos, audio, and 3D models are stored with Git LFS. Install Git LFS before cloning, then run:

```sh
git lfs install
git clone https://github.com/almeidaojose36/iPhone-Duo-3D.git
cd iPhone-Duo-3D
git lfs pull
```

The repository includes all eight chapter projects, narration, music, renders, the assembled film, and shared assets. Shared assets are bundled so the chapter links resolve within this repository. Rendering and narration tools require their respective local dependencies.

## Re-doing things

- **Edit narration:** change `script.md`, run `python3 tools/split_script.py`, then `tools/record.sh cN <beat ids>`, then in the chapter folder `python3 ../tools/make_vo_js.py 1.4` (c1 uses `1.2 f1:4.5`) and `python3 ../tools/build_index.py`. Visuals retime themselves.
- **Check frames:** in a chapter folder, `npx --yes hyperframes@0.8.193 snapshot . --at 5,20,40 --no-end --describe false -o renders/snap`.
- **Review render (1080p30):** `tools/render_reviews.sh` (skips chapters that already have `renders/review_cN.mp4`; delete one to re-render it).
- **Final 4K60:** per chapter `npx --yes hyperframes@0.8.193 render . -f 60 --resolution 4k --quality delivery -o ../chapters_4k/cN.mp4`, then `python3 tools/assemble.py 4k`. Needs roughly 6–8 GB free.

## Facts and estimates

Facts are from the iFixit teardown (Oct 2026) and Apple's spec page (via iStore). Model dimensions not
stated in those sources (layer thicknesses, exact internal positions, chip sizes) are estimates and are
never narrated as facts. The fold rig, the teardrop loop and the vapor chamber visual are illustrations.

## v2 (2026-10-29)

Rebuilt as an educational dissection after review: no fault-finding, micro-level zooms in every chapter,
a new Sound and touch chapter (studio model `models/iPhone_Duo_Sound_Touch`), a recap outro with the
end screen, narration 8% faster and "A20" spoken as "A-20" (the lexicon spelling "Ay" reads as "eye").
Sources for the new facts: Apple's thermal interview (graphite pipe through the hinge, metal-over-foam,
second display engine, DRAM beside the processor) and TSMC's N2 (gate-all-around nanosheets).
How a Hall sensor, OLED, Li-ion cell, image sensor, actuator and speaker work is explained in general
terms; nothing unconfirmed is stated as a fact about this phone.
