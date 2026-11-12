"""Plain-words notes shown above each code cell in the Colab notebooks.

One list per lesson, one note per code cell, in order (cell 0 is the setup cell).
Write for a beginner: what the cell does, and which idea on the lesson page it is.
"""

NOTES = {
    1: [
        "**Setup.** Loads PyTorch, the Python library this course uses for tensors and learning.",
        "**Make a tensor.** A tensor is a box that holds numbers. This one holds 3 numbers in a row.",
        "**Take one number out.** The numbers are counted from 0, so `[0]` is the first one.",
        "**Math on every number at once.** `+ 5` and `* 2` change all 3 numbers in one go, no loop needed.",
        "**A table.** A tensor can also have rows and columns. `[1]` picks a row, `[1, 2]` picks one number in it.",
    ],
    2: [
        "**Setup.** Loads PyTorch and our text: the sentences your model will learn from.",
        "**Find every different character.** Each letter, the space and the full stop count once, sorted. These are all the characters your model knows.",
        "**Give each character a number.** Two lookup tables: character → number, and number → character.",
        "**Text → numbers.** `encode` swaps each character for its number. Models only work with numbers.",
        "**Numbers → text.** `decode` swaps the numbers back, so we can read what the model writes.",
        "**The whole text as a tensor.** Our text, now one row of numbers, ready for the model.",
    ],
    3: [
        "**Setup.** Loads PyTorch and our text, and gives each character a number (as in Lesson 2).",
        "**Count pairs.** For every character, count which character comes right after it. Row = this character, column = the next one.",
        "**Counts into chances.** Divide each row by its total, so every row adds up to 1. Each number is now the chance of that next character.",
        "**Write new text.** Start at “t”, then pick each next character by its chance, like spinning a wheel where likely letters get bigger slices. 40 times.",
    ],
    4: [
        "**Setup.** Loads PyTorch and our text, and gives each character a number.",
        "**Pairs.** Every example is one character and the character right after it. These are the examples the model learns from.",
        "**The model learns.** It starts with random scores, then repeats 300 times: guess (a), measure how wrong with the loss (b), find which way each score should move (c), move a little (d). Watch the loss fall.",
        "**What did it learn after “t”?** The chances of a space, a full stop and an “h” after “t”, from the learned scores.",
    ],
    5: [
        "**Setup.** Loads PyTorch and our text, and gives each character a number.",
        "**Examples.** Every example is the last 3 letters and the letter that came next. There are 44 of them.",
        "**The model: three tables.** One table of random scores for each position: third-last, second-last and last letter. 588 numbers in all.",
        "**The model learns.** A score is the 3 tables' rows added together. 300 times: guess, measure, find directions, move all 3 tables.",
        "**Write new text.** Start from “the” and pick 40 letters, each from the chances after the last 3 letters.",
    ],
    6: [
        "**Setup.** Loads PyTorch and our text, and gives each character a number.",
        "**Examples.** Every example is the last 3 letters and the letter that came next. There are 44 of them.",
        "**The model: embeddings and weights.** The embedding table gives every letter 2 numbers. The weights say how much each of the 6 numbers counts for each next letter. 112 numbers in all.",
        "**The model learns.** Put the 3 letters' embeddings side by side (6 numbers), multiply by the weights to get the scores, then guess, measure, find directions, move. The push reaches the embeddings too.",
        "**Write new text.** Start from “the” and pick 40 letters, each from the chances after the last 3 letters.",
    ],
    7: [
        "**Setup.** Loads PyTorch and our text, and gives each character a number.",
        "**Examples.** Every example is the last 8 letters and the letter that came next.",
        "**The model.** Embeddings (3 numbers per letter), position numbers (3 per place), query, key and value weights, and output weights. All small random numbers to start.",
        "**One guess, step by step.** Each letter's numbers + its position. The last letter's question, every letter's label and value. Matches → attention shares → mix → scores.",
        "**The model learns.** 500 times: guess, measure, find directions, move every number. Watch the loss fall.",
        "**Write new text.** Start from “the cat ” and pick 40 letters, each time looking back at the last 8.",
    ],
}
