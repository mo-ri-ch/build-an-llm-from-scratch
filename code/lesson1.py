import torch

# ---------- Step 1: Create a tensor ----------
numbers = torch.tensor([10, 20, 30])
print("Our tensor:", numbers)
# Our tensor: tensor([10, 20, 30])


# ---------- Step 2: Get one item ----------
first_number = numbers[0]
print("First number:", first_number)
# First number: tensor(10)


# ---------- Step 3: Math on every item at once ----------
numbers_plus_5 = numbers + 5
print("Add 5:", numbers_plus_5)
# Add 5: tensor([15, 25, 35])

numbers_times_2 = numbers * 2
print("Multiply by 2:", numbers_times_2)
# Multiply by 2: tensor([20, 40, 60])
