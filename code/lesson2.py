import torch

text = "hello world"

# Find every different character, sorted
unique_chars = sorted(set(text))
print(unique_chars)

# Give each one a number, and the reverse
char_to_number = {}
number_to_char = {}
for number, char in enumerate(unique_chars):
    char_to_number[char] = number
    number_to_char[number] = char

# Text -> numbers
def encode(some_text):
    numbers = []
    for char in some_text:
        numbers.append(char_to_number[char])
    return numbers

# Numbers -> text
def decode(numbers):
    result = ""
    for number in numbers:
        result = result + number_to_char[number]
    return result

print(encode("hello"))

print(decode([3, 2, 4, 4, 5]))

# The whole text as a tensor (from Lesson 1)
print(torch.tensor(encode(text)))
