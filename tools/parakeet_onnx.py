"""Word timings on Linux, where parakeet-mlx (Apple Silicon only) can't run: the same Parakeet TDT 0.6B v2 model
through sherpa-onnx, written in parakeet-mlx's JSON shape so make_vo_js.py reads it unchanged.
Model: sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 from the k2-fsa/sherpa-onnx GitHub releases, in ~/.cache/parakeet.
Usage: parakeet_onnx.py <out_dir> <wav> [wav ...]  ->  <out_dir>/<name>.json"""
import sys, os, json
import sherpa_onnx, soundfile as sf

D = os.path.expanduser('~/.cache/parakeet/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/')
rec = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=D + 'encoder.int8.onnx', decoder=D + 'decoder.int8.onnx', joiner=D + 'joiner.int8.onnx',
    tokens=D + 'tokens.txt', model_type='nemo_transducer', num_threads=4)
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for wav in sys.argv[2:]:
    a, sr = sf.read(wav, dtype='float32')
    s = rec.create_stream()
    s.accept_waveform(sr, a)
    rec.decode_stream(s)
    r = s.result
    starts = list(r.timestamps)
    # a token ends where the next one starts; the last one gets a typical token length
    ends = starts[1:] + [starts[-1] + 0.24] if starts else []
    toks = [{'text': t, 'start': round(b, 2), 'end': round(e, 2), 'duration': round(e - b, 2)} for t, b, e in zip(r.tokens, starts, ends)]
    sent = {'text': r.text, 'start': toks[0]['start'] if toks else 0, 'end': toks[-1]['end'] if toks else 0, 'tokens': toks}
    name = os.path.splitext(os.path.basename(wav))[0]
    json.dump({'text': r.text.strip(), 'sentences': [sent]}, open(f'{out}/{name}.json', 'w'), indent=1)
