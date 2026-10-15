import torch

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


# ---------- Step 3: Count which character follows which ----------
# A table of zeros. Row = current character, column = next character.
counts = torch.zeros((vocab_size, vocab_size))

for i in range(len(text) - 1):
    current_char = text[i]
    next_char = text[i + 1]

    row = char_to_number[current_char]
    column = char_to_number[next_char]

    counts[row, column] = counts[row, column] + 1


# ---------- Step 4: Turn counts into probabilities ----------
# Divide each box by its row total, so each row adds up to 1
row_totals = counts.sum(dim=1, keepdim=True)
probabilities = counts / row_totals


# ---------- Step 5: Show what follows 't' ----------
t_number = char_to_number['t']
t_row = probabilities[t_number]

print("After 't':")
for number in range(vocab_size):
    probability = t_row[number].item()
    if probability > 0:
        print("  ", repr(number_to_char[number]), round(probability, 3))
# After 't':
#    ' ' 0.375
#    '.' 0.125
#    'h' 0.5


# ---------- Step 6: Generate new text ----------
torch.manual_seed(42)

current_number = char_to_number['t']
output = 't'

for step in range(40):
    # Get the chances for what comes after the current character
    chances = probabilities[current_number]

    # Pick one next character using those chances
    picked = torch.multinomial(chances, num_samples=1)
    current_number = picked.item()

    # Add it to the output
    output = output + number_to_char[current_number]

print("\nGenerated:", output)
# Generated: t on dog mat mat. sathe log the mat cat t
