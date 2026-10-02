# KIẾN TRÚC DỰ ÁN AFFILIATE ĐA NHÁNH (7 NGÀY)

> Phiên bản: v4. Đập và dựng lại theo ý anh: không bám Shopee, chạy nhiều nhánh để tối ưu hoa hồng.
> Trạng thái: **CHƯA GIAO VIỆC, CHƯA BUILD.** Mọi bước ở mục 6 chỉ có hiệu lực sau khi anh duyệt.
> Nguồn số liệu: kết quả tìm kiếm trên báo/bài tổng hợp, chưa phải văn bản gốc. Chỗ nào chưa chắc em ghi ❓.

---

## 1. Kiến trúc một hình (đọc từ trái sang phải)

```
        ĐỘNG CƠ NỘI DUNG (1 cái, dùng chung)              NHIỀU VÒI HOA HỒNG (chọn theo chủ đề bài)
  ┌──────────────────────────────────────────┐        ┌──────────────────────────────────────────┐
  │ Làm bài không lộ mặt, không lộ giọng:    │        │ A. Shopee            (đồ ăn, cafe, anime)│
  │ ảnh, clip ghép, chữ, carousel            │  ───►  │ B. Tài chính VN      (thẻ, TK, chứng khoán)│
  │ Đăng ở nơi người xem đã có sẵn           │        │ C. Crypto có phép VN (chờ giấy phép)     │
  │ Gắn nhãn quảng cáo đúng luật             │        │ D. Forex/crypto nước ngoài (giữ lại)     │
  └──────────────────────────────────────────┘        │ E. Quốc tế hợp pháp  (Wise, Revolut)     │
                    │                                  │ F. Sản phẩm số/SaaS  (khóa học, phần mềm)│
                    ▼                                  └──────────────────────────────────────────┘
        ĐO: click → lượt đăng ký/đơn → hoa hồng ──► vòi nào ra tiền thì dồn thêm bài vào vòi đó
```

**Vì sao thiết kế như vậy:** nút thắt của mọi nhánh giống nhau là **người xem**, không phải sản phẩm. Làm một động cơ nội dung rồi gắn nhiều vòi hoa hồng thì tốn công một lần, tiền vào từ nhiều đường.

---

## 2. Bảng nhánh (tiền, pháp lý, khả năng ra kết quả 7 ngày)

| Nhánh | Tiền mỗi kết quả (tra được) | Pháp lý VN | Điều kiện để bắt đầu | Kết quả trong 7 ngày | Trạng thái |
|---|---|---|---|---|---|
| A. Shopee Video | ~4.400đ/đơn (món 175k, hoa hồng ~2.5%); Hoa Hồng Xtra "lên đến 15%" ❓ chưa biết áp dụng thế nào | 🟢 | Tài khoản đã có | Có thể | Sẵn sàng |
| B. Tài chính VN (thẻ, TK ngân hàng, chứng khoán, bảo hiểm, ví) | Từ ~64k đến ~5 triệu/lượt tùy sản phẩm (HDBank thẻ 180k, VPBank thẻ 650k, chứng khoán 500k–2 triệu, Adflex nêu 500k–5 triệu) | 🟢 nếu sản phẩm của đơn vị có phép và quảng cáo đúng luật | Đăng ký publisher ở Ecomobi/Accesstrade/Adflex/Permate, qua duyệt | Có thể, tùy duyệt và việc người dùng hoàn tất xác minh | Cần đăng ký |
| C. Sàn crypto có giấy phép ở VN | ❓ chưa có chương trình affiliate công khai | 🟢 chỉ khi sàn có giấy phép chính thức | Sàn được cấp phép chính thức VÀ mở affiliate | Chưa thể | **CHỜ SỰ KIỆN** (mục 4) |
| D. Forex/crypto nước ngoài | $200–$1.000+/người nạp tiền đầu (chưa xác minh) | 🟠 vùng xám cho khách nước ngoài, 🔴 cho người Việt | Luật sư xác nhận + khán giả nước ngoài | Không | **GIỮ, chưa làm** |
| E. Wise, Revolut | $10–63/lượt đủ điều kiện | 🟢 | Khán giả đúng nước, nội dung tiếng Anh | Khó | Sau ngày 7 |
| F. Sản phẩm số, SaaS | Hoa hồng 20–50%, có loại thu định kỳ (tra được, chưa xác minh chương trình cụ thể) | 🟢 | Chương trình cụ thể phù hợp chuyên môn tự động hóa của anh | ❓ | Ứng viên, cần chọn chương trình |

### Về crypto trong nước (anh nói đúng)
Việt Nam đang thí điểm sàn tài sản mã hóa theo Nghị quyết 05/2025. Đã có hồ sơ của VIXEX, CTCP Tài sản số Việt Nam, CAEX (hệ VPBank), SCEX, TCEX (hệ Techcombank). TCEX qua vòng 1, còn vòng 2. Từ 1/9/2026 nhà đầu tư trong nước phải giao dịch qua sàn có phép. Mình **chưa thấy xác nhận sàn nào đã được cấp giấy phép chính thức**. Quảng bá sàn chưa có phép bị phạt (cá nhân khoảng 90–100 triệu theo Nghị định 284/2026).

---

## 3. Luật quảng cáo mới ảnh hưởng MỌI nhánh (kể cả Shopee)

Theo các bài tra được về Luật Quảng cáo sửa đổi và quy định KOL, hiệu lực từ 15/5/2026:
- Phải **gắn nhãn rõ đây là quảng cáo/có hợp tác affiliate**. Không gắn: phạt khoảng 60–80 triệu.
- Phải **tự kiểm chứng thông tin sản phẩm** trước khi quảng bá. Quảng bá khi chưa tìm hiểu: phạt khoảng 80–100 triệu.
- Tài chính: không hứa lợi nhuận, không dùng từ tuyệt đối ("tốt nhất", "số 1") khi không có bằng chứng; ngân hàng có thông tư riêng về quảng cáo.
- Hệ quả cho kiến trúc: **mọi bài đều có nhãn quảng cáo**, và nội dung chỉ nói điều có trong tài liệu chính thức của sản phẩm.

⚠️ Kịch bản Shopee em soạn trước đó thiếu nhãn quảng cáo, phải thêm vào.

---

## 4. Điều kiện kích hoạt từng nhánh (không đủ thì KHÔNG làm)

| Nhánh | Điều kiện kích hoạt |
|---|---|
| A | Gắn được sản phẩm vào video và báo cáo ghi nhận click (đo ở ngày đầu) |
| B | Được duyệt publisher + có chiến dịch cụ thể hiển thị rõ điều kiện tính lượt và quy định quảng bá |
| C | Có sàn được cấp giấy phép chính thức + có chương trình giới thiệu hợp lệ |
| D | Luật sư xác nhận bằng văn bản + khán giả nước ngoài |
| E | Có khán giả tiếng Anh đúng nước |
| F | Chọn được 1 chương trình cụ thể, đọc được điều khoản và mức hoa hồng |

## 5. Luật lời/lỗ cho quảng cáo (áp dụng mọi nhánh)

```
Giá click tối đa chịu được = tiền mỗi kết quả × tỉ lệ click ra kết quả (phải đo, không đoán)
```
- Shopee: ~88đ/click nếu tỉ lệ 2% → **không chạy ads** (lỗ).
- Tài chính VN: ví dụ HDBank 180.000đ × 1–3% = 1.800–5.400đ/click → có thể dương, nhưng nền tảng ads có thể hạn chế quảng cáo tài chính (chưa xác minh).
- Trần lỗ 500k, mỗi lần thử tối đa 100k, 0 kết quả sau 100k thì dừng, không nạp thêm. Chỉ bắt đầu sau khi có số đo thật.

---

## 6. Kế hoạch 7 ngày (BẢN NHÁP, CHƯA GIAO)

| Ngày | Mục đích | Đầu ra kiểm tra được |
|---|---|---|
| 1 | Kiểm chứng nhánh A: video gắn sản phẩm có ghi nhận click không | Có/không ghi nhận |
| 1–2 | Chốt chiến dịch cụ thể cho nhánh B | Tên chiến dịch, điều kiện, tiền mỗi lượt |
| 3–4 | Chạy động cơ nội dung cho A và B | Số bài đã đăng, click theo từng nhánh |
| 4 | Quyết định: nhánh nào giữ, nhánh nào bỏ, có chạy ads thử không (theo mục 5) | Bảng quyết định |
| 5–7 | Dồn bài vào nhánh có click | 1 kết quả được ghi nhận ở ít nhất 1 nhánh |

Không build công cụ nào trước ngày 4. Sau ngày 4 nếu việc làm bài chiếm quá nhiều thời gian của anh (1–2 giờ mỗi ngày) thì em đề xuất công cụ tạo nội dung hàng loạt.

---

## 7. Lịch sử trả lời của anh (đã chốt)

| # | Nội dung | Ảnh hưởng |
|---|---|---|
| 1 | Tài khoản Shopee Affiliate đã duyệt | Nhánh A có vé vào cửa |
| 2 | X ít view, FB/TikTok là cá nhân, X khó chạy Shopee VN | Chưa có khán giả, phải tìm nơi người xem có sẵn |
| 3 | Mục tiêu 7 ngày: 1 đơn/lượt ghi nhận | Mốc đo kết quả |
| 4 | 1–2 giờ mỗi ngày | Tối đa vài bài/ngày |
| 5 | Không lộ mặt, không lộ giọng; ads/video/ảnh đều được | Làm nội dung ẩn danh |
| 6 | Ngân sách ads tối đa ~500k, không chấp nhận lỗ không kiểm soát | Mục 5 |
| 7 | Tài chính VN hợp pháp, crypto VN sắp có sàn, cần đa dạng để hoa hồng cao | Kiến trúc đa nhánh này |
| 8 | Không giao việc khi chưa có đánh giá tổng quan | Mục 6 giữ ở dạng nháp |

---

## 8. ĐÁNH GIÁ TỔNG QUAN

| Mắt xích | Trạng thái |
|---|---|
| Có vé vào nhánh A (tài khoản duyệt, đăng được video) | ✅ |
| Gắn sản phẩm có ghi nhận hoa hồng, video có người xem, người xem mua | ❓ Chưa có bằng chứng |
| Nhánh B có chiến dịch hợp pháp, tiền mỗi lượt lớn | ✅ Số liệu có, ❓ chưa qua duyệt publisher |
| Crypto VN, forex nước ngoài | Không ra kết quả trong 7 ngày |
| Lỗ tiền | Không lỗ nếu không chạy ads; ads chỉ khi có số đo |

**Kết luận:** kiến trúc đa nhánh có đường ra kết quả thật. Nhánh B tăng khả năng tiền lớn, nhánh A là đường nhanh nhất để thử. Em không đưa xác suất vì chưa có dữ liệu đo.
