import torch

# Make a tensor
numbers = torch.tensor([10, 20, 30])
print(numbers)
# tensor([10, 20, 30])

# Take one number out
print(numbers[0])
# tensor(10)

# Math on every number at once
print(numbers + 5)
# tensor([15, 25, 35])

print(numbers * 2)
# tensor([20, 40, 60])

# A table
table = torch.tensor([[1, 2, 3],
                      [4, 5, 6],
                      [7, 8, 9]])
print(table[1])
# tensor([4, 5, 6])

print(table[1, 2])
# tensor(6)
