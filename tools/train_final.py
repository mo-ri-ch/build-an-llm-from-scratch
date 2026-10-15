# Usage: put a plain-text book as input.txt next to this file, then:
#   python train_final.py 128 4 5000 128   (embedding size, layers, steps, context length)
# The home-page Neo was trained on Grimm's Fairy Tales (Project Gutenberg) in about 22 minutes on 2 CPU cores.
# The final Build a Tiny LLM model: a small character-level transformer (Lessons 6-9).
import math, time, json, sys, torch, torch.nn as nn, torch.nn.functional as F
torch.manual_seed(1337)
torch.set_num_threads(2)
text = open('input.txt').read()
chars = sorted(set(text)); V = len(chars)
stoi = {c: i for i, c in enumerate(chars)}
data = torch.tensor([stoi[c] for c in text])
n = int(0.9 * len(data)); train, val = data[:n], data[n:]

B, C, H, L = 32, int(sys.argv[1]), 4, int(sys.argv[2])
T = int(sys.argv[4]) if len(sys.argv) > 4 else 64
DROP = 0.1
STEPS = int(sys.argv[3])

def batch(split):
    d = train if split == 'train' else val
    ix = torch.randint(len(d) - T - 1, (B,))
    return torch.stack([d[i:i+T] for i in ix]), torch.stack([d[i+1:i+T+1] for i in ix])

class Block(nn.Module):
    def __init__(s):
        super().__init__()
        s.ln1, s.ln2 = nn.LayerNorm(C), nn.LayerNorm(C)
        s.qkv = nn.Linear(C, 3 * C); s.proj = nn.Linear(C, C)
        s.fc1 = nn.Linear(C, 4 * C); s.fc2 = nn.Linear(4 * C, C)
        s.register_buffer('mask', torch.tril(torch.ones(T, T)).view(1, 1, T, T))
    def forward(s, x):
        b, t, c = x.shape
        q, k, v = s.qkv(s.ln1(x)).split(C, dim=2)
        q, k, v = [z.view(b, t, H, c // H).transpose(1, 2) for z in (q, k, v)]
        att = (q @ k.transpose(-2, -1)) / math.sqrt(c // H)
        att = att.masked_fill(s.mask[:, :, :t, :t] == 0, float('-inf')).softmax(-1)
        y = (att @ v).transpose(1, 2).reshape(b, t, c)
        x = x + F.dropout(s.proj(y), DROP, s.training)
        return x + F.dropout(s.fc2(F.gelu(s.fc1(s.ln2(x)))), DROP, s.training)

class GPT(nn.Module):
    def __init__(s):
        super().__init__()
        s.tok = nn.Embedding(V, C); s.pos = nn.Embedding(T, C)
        s.blocks = nn.ModuleList([Block() for _ in range(L)])
        s.ln = nn.LayerNorm(C); s.head = nn.Linear(C, V)
    def forward(s, idx):
        t = idx.shape[1]
        x = s.tok(idx) + s.pos(torch.arange(t))
        for blk in s.blocks: x = blk(x)
        return s.head(s.ln(x))

m = GPT()
print('params', sum(p.numel() for p in m.parameters()), flush=True)
opt = torch.optim.AdamW(m.parameters(), lr=3e-3)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-3, total_steps=STEPS, pct_start=0.05)
t0 = time.time()
for step in range(STEPS):
    x, y = batch('train')
    loss = F.cross_entropy(m(x).view(-1, V), y.view(-1))
    opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    if step % 250 == 0 or step == STEPS - 1:
        with torch.no_grad():
            m.eval(); vl = sum(F.cross_entropy(m(a).view(-1, V), b_.view(-1)).item() for a, b_ in [batch('val') for _ in range(10)]) / 10; m.train()
        print(f'step {step} train {loss.item():.3f} val {vl:.3f}  {time.time()-t0:.0f}s', flush=True)
torch.save({'state': m.state_dict(), 'chars': chars, 'cfg': dict(C=C, H=H, L=L, T=T, V=V)}, 'model.pt')
m.eval()
idx = torch.tensor([[stoi[c] for c in 'Once upon a time']])
with torch.no_grad():
    for _ in range(300):
        p = (m(idx[:, -T:])[:, -1] / 0.8).softmax(-1)
        idx = torch.cat([idx, torch.multinomial(p, 1)], 1)
print(''.join(chars[i] for i in idx[0].tolist()))
