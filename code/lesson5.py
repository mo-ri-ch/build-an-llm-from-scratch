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

# Groups: the last 3 letters, and the next one
third_last = []
second_last = []
last = []
next_chars = []
for i in range(len(text) - 3):
    third_last.append(char_to_number[text[i]])
    second_last.append(char_to_number[text[i + 1]])
    last.append(char_to_number[text[i + 2]])
    next_chars.append(char_to_number[text[i + 3]])
third_last = torch.tensor(third_last)
second_last = torch.tensor(second_last)
last = torch.tensor(last)
next_chars = torch.tensor(next_chars)
print("Groups:", len(next_chars))

# The model: 3 small tables of random scores
torch.manual_seed(42)
table_third_last = torch.randn((vocab_size, vocab_size), requires_grad=True)
table_second_last = torch.randn((vocab_size, vocab_size), requires_grad=True)
table_last = torch.randn((vocab_size, vocab_size), requires_grad=True)
print("Numbers in the model:", 3 * vocab_size * vocab_size)

# Learn: the same 4 steps as Lesson 4, for all 3 tables
learning_rate = 10
for step in range(300):
    scores = table_third_last[third_last] + table_second_last[second_last] + table_last[last]   # a) predict
    loss = F.cross_entropy(scores, next_chars)                        # b) measure
    table_third_last.grad = None
    table_second_last.grad = None
    table_last.grad = None
    loss.backward()                                                   # c) find directions
    table_third_last.data = table_third_last.data - learning_rate * table_third_last.grad            # d) move
    table_second_last.data = table_second_last.data - learning_rate * table_second_last.grad
    table_last.data = table_last.data - learning_rate * table_last.grad
    if step % 50 == 0:
        print("Step", step, "loss:", round(loss.item(), 3))

# Write 40 new letters, starting from "the"
torch.manual_seed(42)
output = "the"
for step in range(40):
    scores = table_third_last[char_to_number[output[-3]]] + table_second_last[char_to_number[output[-2]]] + table_last[char_to_number[output[-1]]]
    chances = F.softmax(scores, dim=0)
    picked = torch.multinomial(chances, num_samples=1).item()
    output = output + number_to_char[picked]
print(output)
