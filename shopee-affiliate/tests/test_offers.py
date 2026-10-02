import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from affiliate_flow import offers as o  # noqa: E402

SAMPLE = os.path.join(os.path.dirname(__file__), "..", "data", "offers_sample.csv")


class RankTests(unittest.TestCase):
    def test_load_sample_has_20_rows(self):
        self.assertEqual(len(o.load_csv(SAMPLE)), 20)

    def test_percent_formats(self):
        # 4% va 0.04 va 4 deu la 4%
        import tempfile

        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as f:
            f.write("offer_id,name,price,commission_rate\nA,a,100000,4%\nB,b,100000,0.04\nC,c,100000,4\n")
        rows = o.load_csv(f.name)
        os.unlink(f.name)
        self.assertEqual([round(r.commission_rate, 4) for r in rows], [0.04, 0.04, 0.04])

    def test_filter_price_rating_sales(self):
        ranked = {off.offer_id for off, _ in o.rank(o.load_csv(SAMPLE))}
        self.assertNotIn("S002", ranked)  # gia 65k duoi 100k
        self.assertNotIn("S017", ranked)  # rating 4.3 duoi 4.5
        self.assertNotIn("S018", ranked)  # ban 60 duoi 100
        self.assertNotIn("S010", ranked)  # ban 90 duoi 100
        self.assertIn("S009", ranked)

    def test_order_is_descending_and_deterministic(self):
        a = o.rank(o.load_csv(SAMPLE))
        b = o.rank(o.load_csv(SAMPLE))
        self.assertEqual([x[0].offer_id for x in a], [x[0].offer_id for x in b])
        scores = [s for _, s in a]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_commission_cap_applies(self):
        big = o.Offer("t", "X", "x", price=10_000_000, commission_rate=0.1, sales=1000, rating=5.0)
        crit = o.Criteria(min_price=0, max_price=1e9, commission_cap=70_000)
        capped = o.score(big, crit)
        uncapped = o.score(big, o.Criteria(min_price=0, max_price=1e9, commission_cap=None))
        self.assertLess(capped, uncapped)
        self.assertAlmostEqual(capped, 70_000 * __import__("math").log1p(1000) * 1.0)

    def test_top_limit(self):
        self.assertEqual(len(o.rank(o.load_csv(SAMPLE), top=3)), 3)

    def test_known_best(self):
        # Voi tieu chi mac dinh: S009 (245k x 9% = 22,050/don) dung dau trong tap qua loc
        ranked = o.rank(o.load_csv(SAMPLE))
        self.assertEqual(ranked[0][0].offer_id, "S009")


class ShopeeApiTests(unittest.TestCase):
    def test_signature_is_sha256_of_concat(self):
        import hashlib

        self.assertEqual(
            o.shopee_sign("id", "sec", "{}", 123),
            hashlib.sha256(b"id123{}sec").hexdigest(),
        )

    def test_fetch_parses_nodes_with_mock_transport(self):
        seen = {}

        def fake(url, headers, body):
            seen["url"], seen["headers"], seen["body"] = url, headers, body
            return json.dumps(
                {
                    "data": {
                        "productOfferV2": {
                            "nodes": [
                                {
                                    "itemId": 1,
                                    "productName": "A",
                                    "price": "150000",
                                    "commissionRate": "0.05",
                                    "sales": 500,
                                    "ratingStar": "4.8",
                                    "offerLink": "https://s.shopee.vn/x",
                                    "imageUrl": "i.jpg",
                                }
                            ]
                        }
                    }
                }
            ).encode()

        got = o.fetch_shopee("id", "sec", keyword="k", transport=fake, now=lambda: 111)
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0].commission_rate, 0.05)
        self.assertEqual(got[0].link, "https://s.shopee.vn/x")
        self.assertIn("Credential=id, Timestamp=111, Signature=", seen["headers"]["Authorization"])
        self.assertEqual(seen["url"], o.SHOPEE_GRAPHQL_URL)

    def test_fetch_raises_on_api_error(self):
        fake = lambda *a: json.dumps({"errors": [{"message": "bad"}]}).encode()  # noqa: E731
        with self.assertRaises(RuntimeError):
            o.fetch_shopee("id", "sec", transport=fake)

    def test_fetch_empty_ok(self):
        fake = lambda *a: json.dumps({"data": {"productOfferV2": {"nodes": []}}}).encode()  # noqa: E731
        self.assertEqual(o.fetch_shopee("id", "sec", transport=fake), [])


if __name__ == "__main__":
    unittest.main()
