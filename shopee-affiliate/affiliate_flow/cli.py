"""Chay: python3 -m affiliate_flow.cli rank --input data/offers_sample.csv --top 10"""
from __future__ import annotations

import argparse
import sys

from . import offers as o


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="affiliate_flow")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("rank", help="Xep hang keo tu CSV")
    r.add_argument("--input", required=True)
    r.add_argument("--top", type=int, default=10)
    r.add_argument("--min-price", type=float, default=o.Criteria.min_price)
    r.add_argument("--max-price", type=float, default=o.Criteria.max_price)
    r.add_argument("--min-rating", type=float, default=o.Criteria.min_rating)
    r.add_argument("--min-sales", type=int, default=o.Criteria.min_sales)
    args = p.parse_args(argv)

    if args.cmd == "rank":
        crit = o.Criteria(
            min_price=args.min_price,
            max_price=args.max_price,
            min_rating=args.min_rating,
            min_sales=args.min_sales,
        )
        ranked = o.rank(o.load_csv(args.input), crit, top=args.top)
        if not ranked:
            print("Khong co keo nao dat tieu chi.")
            return 1
        print(f"{'#':>2}  {'diem':>9}  {'hoa hong/don':>12}  {'ban':>6}  {'sao':>4}  ten")
        for i, (offer, s) in enumerate(ranked, 1):
            print(
                f"{i:>2}  {s:>9.0f}  {offer.commission_per_order:>12.0f}  "
                f"{offer.sales:>6}  {offer.rating:>4.1f}  {offer.name}"
            )
    return 0


if __name__ == "__main__":
    sys.exit(main())
