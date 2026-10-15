import torch
import torch.nn.functional as F

# ---------- Step 1: Our training text ----------
text = "the cat sat on the mat. the dog sat on the log."

# ---------- Step 2: Give each character a number ----------
unique_chars = sorted(set(text))
vocab_size = len(unique_chars)
char_to_number = {}
number_to_char = {}
for number, char in enumerate(unique_chars):
    char_to_number[char] = number
    number_to_char[number] = char

# ---------- Step 3: Make training examples (3 characters -> next) ----------
context_size = 3
char1_list = []
char2_list = []
char3_list = []
next_list = []
for i in range(len(text) - context_size):
    char1_list.append(char_to_number[text[i]])
    char2_list.append(char_to_number[text[i + 1]])
    char3_list.append(char_to_number[text[i + 2]])
    next_list.append(char_to_number[text[i + 3]])

char1 = torch.tensor(char1_list)
char2 = torch.tensor(char2_list)
char3 = torch.tensor(char3_list)
next_chars = torch.tensor(next_list)

print("Number of examples:", len(next_chars))
# Number of examples: 44

for k in range(4):
    print(repr(text[k:k+3]), "->", repr(text[k+3]))
# 'the' -> ' '
# 'he ' -> 'c'
# 'e c' -> 'a'
# ' ca' -> 't'

# ---------- Step 4: Create the model (3 small tables) ----------
# table1: votes from the character 3 places back
# table2: votes from the character 2 places back
# table3: votes from the character right before
torch.manual_seed(42)
table1 = torch.randn((vocab_size, vocab_size), requires_grad=True)
table2 = torch.randn((vocab_size, vocab_size), requires_grad=True)
table3 = torch.randn((vocab_size, vocab_size), requires_grad=True)
print("Total numbers in model:", table1.numel() + table2.numel() + table3.numel())
# Total numbers in model: 588

# ---------- Step 5: Train ----------
learning_rate = 10
for step in range(300):
    scores = table1[char1] + table2[char2] + table3[char3]
    loss = F.cross_entropy(scores, next_chars)
    table1.grad = None
    table2.grad = None
    table3.grad = None
    loss.backward()
    table1.data = table1.data - learning_rate * table1.grad
    table2.data = table2.data - learning_rate * table2.grad
    table3.data = table3.data - learning_rate * table3.grad
    if step % 50 == 0:
        print("Step", step, "loss:", round(loss.item(), 3))
print("Final loss:", round(loss.item(), 3))
# Step 0 loss: 4.082
# Step 50 loss: 0.199
# ...
# Final loss: 0.174

# ---------- Step 6: Generate ----------
torch.manual_seed(42)
output = "the"
for step in range(40):
    c1 = char_to_number[output[-3]]
    c2 = char_to_number[output[-2]]
    c3 = char_to_number[output[-1]]
    scores = table1[c1] + table2[c2] + table3[c3]
    chances = F.softmax(scores, dim=0)
    picked = torch.multinomial(chances, num_samples=1).item()
    output = output + number_to_char[picked]
print("Generated:", output)
# Generated: the mat. the cat sat on the dog sat on the
