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

# Pairs: this character, and the next one
current_chars = []
next_chars = []
for i in range(len(text) - 1):
    current_chars.append(char_to_number[text[i]])
    next_chars.append(char_to_number[text[i + 1]])
current_chars = torch.tensor(current_chars)
next_chars = torch.tensor(next_chars)

# The model: random scores. requires_grad=True lets PyTorch find gradients.
torch.manual_seed(42)
weights = torch.randn((vocab_size, vocab_size), requires_grad=True)

learning_rate = 10
for step in range(300):
    scores = weights[current_chars]                # a) predict
    loss = F.cross_entropy(scores, next_chars)     # b) measure
    weights.grad = None
    loss.backward()                                # c) find directions
    weights.data = weights.data - learning_rate * weights.grad   # d) move
    if step % 50 == 0:
        print("Step", step, "loss:", round(loss.item(), 3))

# What did it learn after 't'?
probabilities = F.softmax(weights, dim=1)
t_row = probabilities[char_to_number['t']]
for char in [' ', '.', 'h']:
    print(repr(char), round(t_row[char_to_number[char]].item(), 3))
