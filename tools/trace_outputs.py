"""Run lesson code and record which line printed each output.

Returns {line_number: [output lines]} so the page can show every output
right under the print that made it.
"""
import io
import sys


def outputs_by_line(code):
    found = {}
    real_print = print

    def tracing_print(*args, **kwargs):
        line = sys._getframe(1).f_lineno
        buf = io.StringIO()
        real_print(*args, file=buf, **{k: v for k, v in kwargs.items() if k != "file"})
        found.setdefault(line, []).extend(buf.getvalue().rstrip("\n").split("\n"))

    env = {"__name__": "__main__", "print": tracing_print}
    exec(compile(code, "<lesson>", "exec"), env)
    return found
