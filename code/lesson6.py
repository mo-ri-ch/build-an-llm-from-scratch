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

# Examples: the last 3 letters, and the next one
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
print("Examples:", len(next_chars))

# The model: 2 letter numbers per letter, 6 weights per next letter
torch.manual_seed(42)
letter_numbers = torch.randn((vocab_size, 2), requires_grad=True)
weights = torch.randn((6, vocab_size), requires_grad=True)
print("Numbers in the model:", letter_numbers.numel() + weights.numel())

# Learn: predict, measure, find directions, move
learning_rate = 1
for step in range(300):
    numbers = torch.cat([letter_numbers[third_last], letter_numbers[second_last], letter_numbers[last]], dim=1)   # a) the 6 letter numbers of every example
    scores = numbers @ weights                                                             # multiply by the weights, add up
    loss = F.cross_entropy(scores, next_chars)                                       # b) measure
    letter_numbers.grad = None
    weights.grad = None
    loss.backward()                                                                  # c) find directions
    letter_numbers.data = letter_numbers.data - learning_rate * letter_numbers.grad           # d) move
    weights.data = weights.data - learning_rate * weights.grad
    if step % 50 == 0:
        print("Step", step, "loss:", round(loss.item(), 3))

# Write 40 new letters, starting from "the"
torch.manual_seed(42)
output = "the"
for step in range(40):
    numbers = torch.cat([letter_numbers[char_to_number[output[-3]]], letter_numbers[char_to_number[output[-2]]], letter_numbers[char_to_number[output[-1]]]])
    scores = numbers @ weights
    chances = F.softmax(scores, dim=0)
    picked = torch.multinomial(chances, num_samples=1).item()
    output = output + number_to_char[picked]
print(output)
