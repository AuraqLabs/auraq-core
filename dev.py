#!/usr/bin/env python3
"""
Auraq dev server launcher.
Run from the repo root: python dev.py

Starts:
  [data]      python ./data/serve.py
  [cdn]       python ./serve.py
  [templates] python -m http.server 2021  (cwd: ./templates/)
"""

import os
import signal
import subprocess
import sys
import threading


def stream(proc, label):
    for line in iter(proc.stdout.readline, b""):
        print(f"[{label}] {line.decode().rstrip()}", flush=True)


def main():
    root = os.path.dirname(os.path.abspath(__file__))

    services = [
        ("data",      [sys.executable, "./data/serve.py"],              root),
        ("cdn",       [sys.executable, "./serve.py"],                   root),
        ("templates", [sys.executable, "-m", "http.server", "2021"],   os.path.join(root, "templates")),
    ]

    procs = []

    for label, cmd, cwd in services:
        if not os.path.isdir(cwd):
            print(f"[launcher] ERROR: directory not found: {cwd}", flush=True)
            sys.exit(1)

        proc = subprocess.Popen(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        procs.append(proc)

        t = threading.Thread(target=stream, args=(proc, label), daemon=True)
        t.start()

        print(f"[launcher] {label} started  (pid {proc.pid})", flush=True)

    def shutdown(sig=None, frame=None):
        print("\n[launcher] Shutting down...", flush=True)
        for proc in procs:
            proc.terminate()
        for proc in procs:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Block until all processes exit on their own (or shutdown() is called)
    for proc in procs:
        proc.wait()

    shutdown()


if __name__ == "__main__":
    main()
