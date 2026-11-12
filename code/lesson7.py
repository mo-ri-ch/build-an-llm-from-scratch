import torch
import torch.nn.functional as F

text = "the cat sat on the mat. the dog sat on the log."
unique_chars = sorted(set(text))
vocab_size = len(unique_chars)
char_to_number = {}
number_to_char = {}
for number, char in enumerate(unique_chars):
    char_to_number[char] = number
    number_to_char[number] = char

# Examples: the last 8 letters, and the next one
windows = []
next_chars = []
for i in range(len(text) - 8):
    windows.append([char_to_number[c] for c in text[i:i + 8]])
    next_chars.append(char_to_number[text[i + 8]])
windows = torch.tensor(windows)
next_chars = torch.tensor(next_chars)
print("Examples:", len(next_chars))

# The model: small random numbers to start
torch.manual_seed(29)
embedding = (torch.randn((vocab_size, 3)) * 0.5).requires_grad_()   # 3 numbers per letter
position = (torch.randn((8, 3)) * 0.5).requires_grad_()             # 3 numbers per position
query = (torch.randn((3, 3)) * 0.5).requires_grad_()
key = (torch.randn((3, 3)) * 0.5).requires_grad_()
value = (torch.randn((3, 3)) * 0.5).requires_grad_()
out = (torch.randn((3, vocab_size)) * 0.5).requires_grad_()
params = [embedding, position, query, key, value, out]
print("Numbers in the model:", sum(p.numel() for p in params))

# One guess: look back, weigh, mix
def guess(win):
    x = embedding[win] + position                      # each letter's numbers, plus its position's
    q = x[:, -1] @ query                               # the last letter's question
    k = x @ key                                        # every letter's label
    v = x @ value                                      # what every letter offers
    match = (k @ q.unsqueeze(2)).squeeze(2) / 3 ** 0.5  # how well each label fits the question
    attention = F.softmax(match, dim=1)                # shares that add up to 1
    mixed = (attention.unsqueeze(2) * v).sum(dim=1)    # mix the offers by those shares
    return (mixed + x[:, -1]) @ out, attention         # scores for every next letter

# Learn: predict, measure, find directions, move
learning_rate = 0.5
for step in range(300):
    scores, attention = guess(windows)
    loss = F.cross_entropy(scores, next_chars)
    for p in params:
        p.grad = None
    loss.backward()
    for p in params:
        p.data = p.data - learning_rate * p.grad
    if step % 50 == 0:
        print("Step", step, "loss:", round(loss.item(), 3))
print("Final loss:", round(loss.item(), 3))

# Write 40 new letters, starting from "the cat "
torch.manual_seed(42)
output = "the cat "
for step in range(40):
    win = torch.tensor([[char_to_number[c] for c in output[-8:]]])
    scores, attention = guess(win)
    chances = F.softmax(scores[0], dim=0)
    picked = torch.multinomial(chances, num_samples=1).item()
    output = output + number_to_char[picked]
print(output)
