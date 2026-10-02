"""Mo-dun 1: nhat keo.

Doc danh sach keo (san pham/chien dich) tu CSV hoac Shopee Affiliate Open API,
loc theo tieu chi, cham diem, xep hang.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import time
import urllib.request
from dataclasses import dataclass, field
from typing import Callable, Iterable

SHOPEE_GRAPHQL_URL = "https://open-api.affiliate.shopee.vn/graphql"

PRODUCT_OFFER_QUERY = """
query ($keyword: String, $page: Int, $limit: Int) {
  productOfferV2(keyword: $keyword, page: $page, limit: $limit) {
    nodes {
      itemId productName price commissionRate sales ratingStar
      imageUrl shopName productLink offerLink
    }
  }
}
"""


@dataclass
class Offer:
    source: str
    offer_id: str
    name: str
    price: float  # VND
    commission_rate: float  # 0.05 = 5%
    sales: int = 0
    rating: float = 0.0
    link: str = ""
    image_url: str = ""
    extra: dict = field(default_factory=dict)

    @property
    def commission_per_order(self) -> float:
        return self.price * self.commission_rate


@dataclass
class Criteria:
    min_price: float = 100_000
    max_price: float = 250_000
    min_rating: float = 4.5
    min_sales: int = 100
    min_commission_rate: float = 0.0
    commission_cap: float | None = 70_000  # tran hoa hong moi don (tra cuu, chua xac minh)


def _num(value, default=0.0) -> float:
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return default


def load_csv(path: str, source: str = "csv") -> list[Offer]:
    """Cot bat buoc: offer_id,name,price,commission_rate. Cot tuy chon: sales,rating,link,image_url.
    commission_rate chap nhan 0.05 hoac 5 (hieu la 5%) hoac "5%"."""
    offers: list[Offer] = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            rate_raw = str(row.get("commission_rate", "0")).strip()
            rate = _num(rate_raw.rstrip("%"))
            if rate_raw.endswith("%") or rate > 1:
                rate /= 100
            offers.append(
                Offer(
                    source=source,
                    offer_id=str(row["offer_id"]).strip(),
                    name=str(row["name"]).strip(),
                    price=_num(row["price"]),
                    commission_rate=rate,
                    sales=int(_num(row.get("sales", 0))),
                    rating=_num(row.get("rating", 0)),
                    link=str(row.get("link", "")).strip(),
                    image_url=str(row.get("image_url", "")).strip(),
                )
            )
    return offers


def passes(offer: Offer, c: Criteria) -> bool:
    return (
        c.min_price <= offer.price <= c.max_price
        and offer.rating >= c.min_rating
        and offer.sales >= c.min_sales
        and offer.commission_rate >= c.min_commission_rate
    )


def score(offer: Offer, c: Criteria) -> float:
    """Diem = hoa hong moi don (co tran) x do tin cay ban chay x he so danh gia.

    - hoa hong moi don: tien that kiem duoc khi co 1 don
    - log(1+sales): mon ban nhieu de chot hon, nhung tang cham de mon cuc nhieu khong ap dao
    - rating/5: phat nhe mon danh gia thap
    """
    commission = offer.commission_per_order
    if c.commission_cap is not None:
        commission = min(commission, c.commission_cap)
    return commission * math.log1p(offer.sales) * (offer.rating / 5.0)


def rank(offers: Iterable[Offer], c: Criteria | None = None, top: int | None = None) -> list[tuple[Offer, float]]:
    c = c or Criteria()
    scored = [(o, score(o, c)) for o in offers if passes(o, c)]
    scored.sort(key=lambda t: (-t[1], t[0].offer_id))  # on dinh khi bang diem
    return scored[:top] if top else scored


# ---------- Shopee Affiliate Open API ----------
# CHUA KIEM CHUNG VOI API THAT (can AppId/Secret + mang). Viet theo tai lieu tra cuu:
# POST GraphQL, header Authorization: SHA256 Credential=<appId>, Timestamp=<ts>, Signature=<sha256(appId+ts+payload+secret)>

Transport = Callable[[str, dict, bytes], bytes]


def _default_transport(url: str, headers: dict, body: bytes) -> bytes:
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310 (URL co dinh)
        return resp.read()


def shopee_sign(app_id: str, secret: str, payload: str, timestamp: int) -> str:
    return hashlib.sha256(f"{app_id}{timestamp}{payload}{secret}".encode()).hexdigest()


def fetch_shopee(
    app_id: str,
    secret: str,
    keyword: str = "",
    page: int = 1,
    limit: int = 50,
    transport: Transport | None = None,
    now: Callable[[], int] = lambda: int(time.time()),
) -> list[Offer]:
    payload = json.dumps(
        {"query": PRODUCT_OFFER_QUERY, "variables": {"keyword": keyword, "page": page, "limit": limit}},
        separators=(",", ":"),
    )
    ts = now()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"SHA256 Credential={app_id}, Timestamp={ts}, Signature={shopee_sign(app_id, secret, payload, ts)}",
    }
    raw = (transport or _default_transport)(SHOPEE_GRAPHQL_URL, headers, payload.encode())
    data = json.loads(raw)
    if data.get("errors"):
        raise RuntimeError(f"Shopee API loi: {data['errors']}")
    nodes = (((data.get("data") or {}).get("productOfferV2")) or {}).get("nodes") or []
    return [
        Offer(
            source="shopee_api",
            offer_id=str(n.get("itemId", "")),
            name=str(n.get("productName", "")),
            price=_num(n.get("price")),
            commission_rate=_num(n.get("commissionRate")),
            sales=int(_num(n.get("sales"))),
            rating=_num(n.get("ratingStar")),
            link=str(n.get("offerLink") or n.get("productLink") or ""),
            image_url=str(n.get("imageUrl", "")),
        )
        for n in nodes
    ]
