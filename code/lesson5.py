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
table1 = torch.randn((vocab_size, vocab_size), requires_grad=True)
table2 = torch.randn((vocab_size, vocab_size), requires_grad=True)
table3 = torch.randn((vocab_size, vocab_size), requires_grad=True)
print("Numbers in the model:", 3 * vocab_size * vocab_size)

# Learn: the same 4 steps as Lesson 4, for all 3 tables
learning_rate = 10
for step in range(300):
    scores = table1[third_last] + table2[second_last] + table3[last]   # a) predict
    loss = F.cross_entropy(scores, next_chars)                        # b) measure
    table1.grad = None
    table2.grad = None
    table3.grad = None
    loss.backward()                                                   # c) find directions
    table1.data = table1.data - learning_rate * table1.grad            # d) move
    table2.data = table2.data - learning_rate * table2.grad
    table3.data = table3.data - learning_rate * table3.grad
    if step % 50 == 0:
        print("Step", step, "loss:", round(loss.item(), 3))

# Write 40 new letters, starting from "the"
torch.manual_seed(42)
output = "the"
for step in range(40):
    scores = table1[char_to_number[output[-3]]] + table2[char_to_number[output[-2]]] + table3[char_to_number[output[-1]]]
    chances = F.softmax(scores, dim=0)
    picked = torch.multinomial(chances, num_samples=1).item()
    output = output + number_to_char[picked]
print(output)
