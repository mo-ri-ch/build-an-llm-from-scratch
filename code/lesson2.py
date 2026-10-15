import torch

# ---------- Step 1: Our text ----------
text = "hello world"


# ---------- Step 2: Find unique characters ----------
unique_chars = sorted(set(text))
vocab_size = len(unique_chars)

print("Unique characters:", unique_chars)
# Unique characters: [' ', 'd', 'e', 'h', 'l', 'o', 'r', 'w']

print("Vocabulary size:", vocab_size)
# Vocabulary size: 8


# ---------- Step 3: Give each character a number ----------
char_to_number = {}
number_to_char = {}
for number, char in enumerate(unique_chars):
    char_to_number[char] = number
    number_to_char[number] = char

print("Character to number:", char_to_number)
# Character to number: {' ': 0, 'd': 1, 'e': 2, 'h': 3, 'l': 4, 'o': 5, 'r': 6, 'w': 7}


# ---------- Step 4: Encode (text -> numbers) ----------
def encode(some_text):
    numbers = []
    for char in some_text:
        numbers.append(char_to_number[char])
    return numbers


# ---------- Step 5: Decode (numbers -> text) ----------
def decode(numbers):
    result = ""
    for number in numbers:
        result = result + number_to_char[number]
    return result


# ---------- Step 6: Try it ----------
encoded = encode("hello")
print("Encoded 'hello':", encoded)
# Encoded 'hello': [3, 2, 4, 4, 5]

decoded = decode(encoded)
print("Decoded back:", decoded)
# Decoded back: hello


# ---------- Step 7: Whole text as a tensor ----------
data = torch.tensor(encode(text))
print("Text as a tensor:", data)
# Text as a tensor: tensor([3, 2, 4, 4, 5, 0, 7, 5, 6, 4, 1])
