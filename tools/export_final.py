# Export the trained model for the browser: weights as int8 with one scale per row (small download).
import torch, json, base64, numpy as np
ck = torch.load('model.pt'); sd = ck['state']
out = {'chars': ck['chars'], 'cfg': ck['cfg'], 'tensors': {}}
for name, t in sd.items():
    if name.endswith('mask'): continue
    a = t.float().numpy()
    if a.ndim == 2:
        scale = np.abs(a).max(axis=1) / 127.0 + 1e-12
        q = np.round(a / scale[:, None]).astype(np.int8)
        out['tensors'][name] = {'shape': list(a.shape), 'q': base64.b64encode(q.tobytes()).decode(), 'scale': [float(f'{s:.6g}') for s in scale]}
    else:
        out['tensors'][name] = {'shape': list(a.shape), 'f': [float(f'{v:.6g}') for v in a.ravel()]}
json.dump(out, open('neo-final.json', 'w'), separators=(',', ':'))
print('bytes', len(json.dumps(out, separators=(',', ':'))))
