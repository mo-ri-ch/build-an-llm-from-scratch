"""Record a step-by-step run of each lesson's code, for the "Step through" button on the code page.

Run from the repo root:  python tools/make_traces.py
Reads code/lessonN.py, runs it line by line (like Thonny's debugger), and writes assets/traces/lessonN.json:
  - every step: which line ran, the variables after it, what changed, and the output so far
  - long loops show their first 3 rounds, then one "skipped N more rounds" step
  - a plain-English explanation for each line (from tools/explanations.py)
"""
import ast
import contextlib
import glob
import io
import json
import os
import re
import sys
import types

sys.path.insert(0, "tools")
from explanations import EXPLAIN

SHOW_ROUNDS = 3        # rounds of a long loop to show before skipping
SHORT_LOOP = 8         # loops with this many rounds or fewer are shown in full
FILENAME = "<lesson>"


def show(value):
    """A short, readable version of a value."""
    try:
        import torch
        if isinstance(value, torch.Tensor):
            v = value.detach()
            shape = " × ".join(str(s) for s in v.shape)
            if v.numel() <= 16:
                text = repr(v).replace("\n", "").replace("       ", " ")
                text = re.sub(r"\s+", " ", text).replace("[ ", "[").replace("( ", "(")
                return text
            first = v.flatten()[:6]
            if v.dtype.is_floating_point:
                items = ", ".join(f"{x:.4f}" for x in first.tolist())
            else:
                items = ", ".join(str(x) for x in first.tolist())
            return f"tensor, shape {shape}: [{items}, …]"
    except ImportError:
        pass
    if isinstance(value, types.FunctionType):
        args = ", ".join(value.__code__.co_varnames[:value.__code__.co_argcount])
        return f"function {value.__name__}({args})"
    if isinstance(value, float):
        value = round(value, 4)
    text = repr(value)
    if len(text) > 110:
        size = f"  ({len(value)} items)" if hasattr(value, "__len__") else ""
        text = text[:100] + " …" + size
    return text


def user_vars(namespace):
    out = {}
    for name, value in namespace.items():
        if name.startswith("__") or isinstance(value, types.ModuleType):
            continue
        out[name] = show(value)
        grad = value.grad if getattr(value, "is_leaf", False) and getattr(value, "requires_grad", False) else None
        if grad is not None:
            out[name + ".grad"] = show(grad)   # gradients that loss.backward() filled in
    return out


def statement_spans(source):
    """First line of each statement -> its last line (for statements that span several lines)."""
    spans, loops = {}, {}
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.stmt):
            if isinstance(node, (ast.For, ast.While, ast.If, ast.FunctionDef)):
                header_end = node.body[0].lineno - 1
                spans[node.lineno] = max(node.lineno, header_end)
            else:
                spans[node.lineno] = node.end_lineno
        if isinstance(node, (ast.For, ast.While)):
            loops[node.lineno] = node.end_lineno
    return spans, loops


def run(source, record, on_return=None):
    """Run the code, calling record(frame, lineno, output_so_far) before each line."""
    out = io.StringIO()
    namespace = {"__name__": "__main__"}

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None
        if event == "line":
            record(frame, frame.f_lineno, out.getvalue(), namespace)
        elif event == "return" and on_return:
            on_return(frame)
        if event == "return" and frame.f_back is not None and frame.f_back.f_code.co_filename == FILENAME:
            record(frame.f_back, frame.f_back.f_lineno, out.getvalue(), namespace, back=(frame.f_code.co_name, arg))
        return tracer

    code = compile(source, FILENAME, "exec")
    with contextlib.redirect_stdout(out):
        sys.settrace(tracer)
        try:
            exec(code, namespace)
        finally:
            sys.settrace(None)
    return namespace, out.getvalue()


def rounds_per_loop(source, loops, spans):
    """For each loop: how many rounds it took, each time it ran (in order)."""
    totals = {}
    current = {}

    def finish(key):
        totals.setdefault(key[1], []).append(max(0, current.pop(key) - 1))  # the header runs once more at the end

    def record(frame, lineno, output, namespace, back=False):
        if back or lineno not in spans:
            return
        for key in list(current):
            if key[0] == id(frame) and key[1] != lineno and not (key[1] <= lineno <= loops[key[1]]):
                finish(key)
        if lineno in loops:
            key = (id(frame), lineno)
            current[key] = current.get(key, 0) + 1

    def tracer_return(frame):
        for key in list(current):
            if key[0] == id(frame):
                finish(key)

    run(source, record, on_return=tracer_return)
    for key in list(current):
        finish(key)
    return totals


def trace(path):
    source = open(path, encoding="utf-8").read()
    lines = source.rstrip("\n").split("\n")
    spans, loops = statement_spans(source)
    total_rounds = rounds_per_loop(source, loops, spans)
    runs_seen = {}

    snapshots = []        # (lineno, scope, globals, locals, output)
    skipping = {}         # (frame id, loop line) -> rounds skipped
    rounds = {}

    def snap(frame, lineno, output, namespace):
        scope = frame.f_code.co_name if frame.f_code.co_name != "<module>" else None
        local = user_vars(frame.f_locals) if scope else {}
        return {"line": lineno, "scope": scope, "vars": user_vars(namespace), "locals": local, "out": output}

    def record(frame, lineno, output, namespace, back=False):
        if lineno not in spans:
            return   # the 2nd, 3rd… line of a statement that spans several lines
        fid = id(frame)
        # Are we inside a loop we're skipping?
        for (sfid, start), count in list(skipping.items()):
            if sfid != fid:
                continue
            if start <= lineno <= loops[start]:
                if lineno == start:
                    skipping[(sfid, start)] = count + 1
                return
            # Left the loop: add one "skipped" step, then carry on
            del skipping[(sfid, start)]
            done = snap(frame, start, output, namespace)
            done["skip"] = count - 1 if count > 0 else 0
            snapshots.append(done)
        if lineno in loops:
            key = (fid, lineno)
            rounds[key] = rounds.get(key, 0) + 1
            if rounds[key] == 1:
                runs_seen[lineno] = runs_seen.get(lineno, -1) + 1
            this_run = total_rounds.get(lineno, [0])[min(runs_seen.get(lineno, 0), len(total_rounds.get(lineno, [0])) - 1)]
            if this_run > SHORT_LOOP and rounds[key] > SHOW_ROUNDS:
                skipping[key] = 1
                hidden = snap(frame, lineno, output, namespace)   # the state after round 3
                hidden["hidden"] = True
                snapshots.append(hidden)
                return
        for key in list(rounds):
            if key[0] == fid and key[1] != lineno and not (key[1] <= lineno <= loops[key[1]]):
                del rounds[key]
        now = snap(frame, lineno, output, namespace)
        if back:
            now["back"] = True   # back in the line that called the function
            now["ret"] = [back[0], show(back[1])]
        snapshots.append(now)

    namespace, output = run(source, record)
    for (sfid, start), count in skipping.items():   # the code ended inside a skipped loop
        snapshots.append({"line": start, "scope": None, "vars": user_vars(namespace), "locals": {},
                          "out": output, "skip": count - 1})
    end = {"line": None, "scope": None, "vars": user_vars(namespace), "locals": {}, "out": output}
    snapshots.append(end)

    # Step k = "line k just ran": show the state *after* it (the next snapshot)
    steps = []
    for k in range(len(snapshots) - 1):
        before, after = snapshots[k], snapshots[k + 1]
        if before.get("hidden"):
            continue
        if before.get("skip") is not None:
            steps.append({
                "line": before["line"], "end": spans.get(before["line"], before["line"]),
                "skip": before["skip"], "vars": before["vars"], "locals": {},
                "scope": before["scope"], "changed": [], "out": before["out"],
            })
            continue
        prev_vars = dict(before["vars"])
        prev_vars.update({"@" + k2: v for k2, v in before["locals"].items()})
        now = dict(after["vars"])
        now.update({"@" + k2: v for k2, v in after["locals"].items()})
        changed = [name for name, v in now.items() if prev_vars.get(name) != v]
        steps.append({
            "line": before["line"], "end": spans.get(before["line"], before["line"]),
            "scope": after["scope"] or None, "vars": after["vars"], "locals": after["locals"],
            "changed": changed, "out": after["out"],
        })
        if before.get("back"):
            steps[-1]["back"] = True
        if after.get("ret"):
            steps[-1]["ret"] = after["ret"]   # the function's answer

    explain = {}
    for i, text in enumerate(lines, start=1):
        key = text.split("#")[0].strip()
        if key in EXPLAIN:
            explain[i] = EXPLAIN[key]
    missing = sorted({s["line"] for s in steps if s["line"] not in explain})
    if missing:
        print(f"  {path}: no explanation for lines", [lines[i - 1].strip() for i in missing])
    return {"steps": steps, "explain": explain}


if __name__ == "__main__":
    os.makedirs("assets/traces", exist_ok=True)
    targets = sys.argv[1:] or sorted(glob.glob("code/lesson[1-4].py"))
    for path in targets:
        n = re.search(r"lesson(\d+)", path).group(1)
        data = trace(path)
        with open(f"assets/traces/lesson{n}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        print(f"assets/traces/lesson{n}.json: {len(data['steps'])} steps")
