import torch

# Make a tensor
numbers = torch.tensor([10, 20, 30])
print(numbers)

# Take one number out
print(numbers[0])

# Math on every number at once
print(numbers + 5)

print(numbers * 2)

# A table
table = torch.tensor([[1, 2, 3],
                      [4, 5, 6],
                      [7, 8, 9]])
print(table[1])

print(table[1, 2])
