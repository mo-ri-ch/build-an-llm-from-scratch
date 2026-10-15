"""Find which comment lines in lesson code are expected *outputs* (answers).

An output line is a full-line comment that comes straight after a line with print(...),
or straight after another output line.
"""
import re


def mark_outputs(lines):
    """Return a list of booleans: True where the line is an expected-output comment."""
    marks = []
    after_print = False
    for line in lines:
        stripped = line.strip()
        is_comment = stripped.startswith("#")
        if is_comment and after_print:
            marks.append(True)
            continue
        marks.append(False)
        code_part = re.split(r"\s{2,}#", line)[0]
        after_print = (not is_comment) and "print(" in code_part
    return marks
