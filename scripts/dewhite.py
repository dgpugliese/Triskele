#!/usr/bin/env python3
"""Strip a white/near-white background from ChatGPT-generated PNGs.

For each pixel we compute "whiteness" = min(R,G,B). Pixels at or above the
threshold become transparent; pixels well below stay fully opaque. In the
narrow transition band we map alpha proportionally so antialiased edges
keep their softness instead of producing a hard halo.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image


def dewhite(src: Path, dst: Path, threshold: int = 240, soft: int = 12) -> None:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    lo = threshold - soft
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            whiteness = min(r, g, b)
            if whiteness >= threshold:
                a = 0
            elif whiteness < lo:
                a = 255
            else:
                # Linear falloff across the soft band.
                a = max(0, min(255, ((threshold - whiteness) * 255) // soft))
            px[x, y] = (r, g, b, a)
    im.save(dst, optimize=True)
    print(f"  {dst}  {im.size}")


def resize_with_alpha(src: Path, dst: Path, max_dim: int) -> None:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    im.save(dst, optimize=True)
    print(f"  {dst}  {im.size}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("src", type=Path)
    p.add_argument("--out", type=Path, default=None)
    p.add_argument("--threshold", type=int, default=240)
    p.add_argument("--soft", type=int, default=12)
    args = p.parse_args()

    if not args.src.exists():
        print(f"missing: {args.src}", file=sys.stderr)
        return 1

    base = args.out or args.src.with_name(args.src.stem + "-rgba.png")
    dewhite(args.src, base, threshold=args.threshold, soft=args.soft)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
