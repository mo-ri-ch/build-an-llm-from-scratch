import torch

text = "the cat sat on the mat. the dog sat on the log."

unique_chars = sorted(set(text))
vocab_size = len(unique_chars)
char_to_number = {}
number_to_char = {}
for number, char in enumerate(unique_chars):
    char_to_number[char] = number
    number_to_char[number] = char

# Count pairs. Row = this character, column = next one.
counts = torch.zeros((vocab_size, vocab_size))
for i in range(len(text) - 1):
    row = char_to_number[text[i]]
    column = char_to_number[text[i + 1]]
    counts[row, column] = counts[row, column] + 1

# Counts into chances: divide by each row's total
row_totals = counts.sum(dim=1, keepdim=True)
probabilities = counts / row_totals

t_row = probabilities[char_to_number['t']]
for number in range(vocab_size):
    if t_row[number] > 0:
        print(repr(number_to_char[number]), round(t_row[number].item(), 3))

# Write new text: roll the weighted dice 40 times
torch.manual_seed(42)
current = char_to_number['t']
output = 't'
for step in range(40):
    picked = torch.multinomial(probabilities[current], num_samples=1)
    current = picked.item()
    output = output + number_to_char[current]
print(output)
