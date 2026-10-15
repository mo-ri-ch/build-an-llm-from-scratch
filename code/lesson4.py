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

print("Vocabulary size:", vocab_size)
# Vocabulary size: 14


# ---------- Step 3: Make training pairs ----------
current_chars = []
next_chars = []
for i in range(len(text) - 1):
    current_chars.append(char_to_number[text[i]])
    next_chars.append(char_to_number[text[i + 1]])

current_chars = torch.tensor(current_chars)
next_chars = torch.tensor(next_chars)

print("Number of training pairs:", len(current_chars))
# Number of training pairs: 46


# ---------- Step 4: Create the model ----------
torch.manual_seed(42)
weights = torch.randn((vocab_size, vocab_size), requires_grad=True)

print("Row for 't':", weights[13])
# Row for 't': tensor([ 0.4788,  1.3537, -0.1593, -0.4249,  0.9442, -0.1849,  0.1852,
#                       1.0687,  1.3065,  0.4598,  0.2618, -0.7599, -2.0461, -1.5295])


# ---------- Step 5: Train the model ----------
learning_rate = 10
number_of_steps = 300

for step in range(number_of_steps):

    # a) Predict
    scores = weights[current_chars]

    # b) Measure how wrong
    loss = F.cross_entropy(scores, next_chars)

    # c) Find directions
    weights.grad = None
    loss.backward()

    # d) Move
    weights.data = weights.data - learning_rate * weights.grad

    if step % 50 == 0:
        print("Step", step, "loss:", round(loss.item(), 3))

# Step 0 loss: 3.086
# Step 50 loss: 0.746
# Step 100 loss: 0.722
# Step 150 loss: 0.714
# Step 200 loss: 0.711
# Step 250 loss: 0.709


# ---------- Step 6: See what the model learned ----------
probabilities = F.softmax(weights, dim=1)

t_number = char_to_number['t']
t_row = probabilities[t_number]

print("After 't':")
for number in range(vocab_size):
    probability = t_row[number].item()
    if probability > 0.01:
        print("  ", repr(number_to_char[number]), round(probability, 3))

# After 't':
#    ' ' 0.374
#    '.' 0.124
#    'h' 0.499
