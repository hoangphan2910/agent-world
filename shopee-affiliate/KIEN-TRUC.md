# KIẾN TRÚC: WORKFLOW AFFILIATE TỰ ĐỘNG (7 NGÀY BUILD)

> Phiên bản: v5. Đổi mục tiêu theo anh: **7 ngày để dựng một workflow tự động hoàn chỉnh, tự động nhiều nhất có thể. Không bắt buộc ra đơn.**
> Trạng thái: **TẠM DỪNG BUILD.** Em đã build Ngày 1 khi anh chưa duyệt từng bước, sai yêu cầu. Từ giờ mỗi bước làm theo thứ tự: em giải thích → anh duyệt hoặc sửa → em mới build → em báo kết quả bằng lời dễ hiểu. Ngày 1 để ở trạng thái "đề xuất, chưa được duyệt".
> Nguồn: kết quả tìm kiếm (bài tổng hợp, tài liệu API). Chỗ chưa chắc em ghi ❓.

---

## 1. Kết quả thật của 7 ngày là gì

Một hệ thống chạy được từ đầu đến cuối, mỗi ngày tự làm:

```
 [1 NHẶT KÈO] → [2 TẠO LINK THEO DÕI] → [3 LÀM BÀI] → [4 KIỂM TRA LUẬT] → [5 XẾP LỊCH ĐĂNG] → [6 ĐO KẾT QUẢ] → [7 TỰ ĐIỀU CHỈNH]
   chọn món/        link affiliate có      kịch bản,        chặn bài vi        gói bài sẵn sàng      kéo báo cáo         bỏ món/mẫu bài
   chiến dịch       mã riêng cho từng bài  caption, video   phạm trước khi     đăng mỗi ngày         click/đơn           không ra, dồn
   hoa hồng cao                            không lộ mặt     ra khỏi máy                                                  vào cái ra tiền
                                                                                                                         │
                                                                              [8 ĐIỀU PHỐI: chạy tự động mỗi ngày, báo lỗi] ◄┘
```

**Tiêu chí hoàn thành (đo được):** chạy 1 lệnh thì ra đủ "gói bài trong ngày" (video + caption + link theo dõi + nhãn quảng cáo) và báo cáo hôm trước. Mỗi mô-đun có bài kiểm tra tự động qua/rớt.

---

## 2. Mô-đun, mức tự động, và cánh cửa kỹ thuật thật

| # | Mô-đun | Làm gì | Tự động? | Căn cứ kỹ thuật (tra được) |
|---|---|---|---|---|
| 1 | Nhặt kèo | Lấy danh sách sản phẩm/chiến dịch, chấm điểm theo hoa hồng, bán chạy, đánh giá | ✅ Tự động | Shopee Affiliate Open API có `productOfferV2`, `shopOfferV2`. Tài chính: Accesstrade có API danh sách chiến dịch. Cần AppId/Secret ❓ |
| 2 | Tạo link theo dõi | Tạo link rút gọn kèm mã riêng từng bài để biết bài nào ra tiền | ✅ Tự động | Shopee `generateShortLink` / `generateBatchShortLink`, hỗ trợ tối đa 5 `subIds` |
| 3 | Làm bài | Viết kịch bản, caption; ghép video dọc từ ảnh sản phẩm + chữ, không mặt không giọng | ✅ Tự động (bản đầu theo mẫu, có thể nâng cấp) | Công cụ xử lý ảnh/video chạy trên máy/máy chủ; ảnh sản phẩm lấy từ dữ liệu kèo ❓ chưa kiểm chính sách dùng ảnh |
| 4 | Kiểm tra luật | Tự chặn bài thiếu nhãn quảng cáo, có từ tuyệt đối ("tốt nhất"), hứa lợi nhuận (tài chính) | ✅ Tự động | Quy tắc tra được: Luật Quảng cáo sửa đổi, KOL từ 15/5/2026 (phải gắn nhãn, phải kiểm chứng) |
| 5 | Xếp lịch đăng | Ra "gói bài" mỗi ngày + lịch giờ đăng | ✅ Tự động ra gói. **Đăng thật: một phần** | Shopee Video: ❓ **không thấy API đăng video** cho người sáng tạo (SDK tìm thấy chỉ dành cho người bán đăng ảnh/video sản phẩm). TikTok, YouTube: có API nhưng **bài bị ép riêng tư cho đến khi app qua kiểm duyệt**. X: trả theo bài (~$0.20/bài có link). Meta: miễn phí nhưng phải qua duyệt app |
| 6 | Đo kết quả | Kéo báo cáo click/đơn/hoa hồng theo từng mã bài | ✅ Tự động | Shopee `conversionReport` (đơn, tổng hợp, click). Accesstrade: báo cáo chuyển đổi, giới hạn 1 lần/5 phút, tối đa 7 ngày mỗi lần gọi |
| 7 | Tự điều chỉnh | Bỏ món 0 click sau N bài; dồn bài vào món/mẫu có click; máy tính hòa vốn ads | ✅ Tự động (quy tắc rõ ràng) | Quy tắc lời/lỗ ở mục 5. **Chi tiền ads: không tự động**, chỉ ra khuyến nghị |
| 8 | Điều phối | Chạy theo lịch mỗi ngày, ghi nhật ký, báo lỗi | ✅ Tự động | Dùng bộ lập lịch có sẵn trên GitHub (Actions) ❓ cần bật và đặt khóa bí mật |

**Số thật về mức tự động:** 8 mô-đun, 7 chạy hoàn toàn tự động. Mô-đun 5 là chỗ không tự động hết: đăng lên Shopee Video em chưa thấy cách tự động (mục 6), TikTok và YouTube bị ép riêng tư tới khi qua kiểm duyệt. Em không giấu chỗ này.

---

## 3. Nhánh hoa hồng cắm vào workflow (nguồn kèo)

Workflow không phụ thuộc Shopee. Mỗi nhánh chỉ là một "nguồn kèo" cắm vào mô-đun 1 và 6.

| Nhánh | Pháp lý | Cách cắm vào | Làm trong 7 ngày? |
|---|---|---|---|
| A. Shopee | 🟢 | API chính thức (mục 2) | ✅ Làm đầu tiên |
| B. Tài chính VN (thẻ, tài khoản, chứng khoán, bảo hiểm) | 🟢 nếu sản phẩm có phép và quảng cáo đúng luật | Accesstrade API; mạng khác nhập tay vào bảng kèo | ✅ Làm nguồn kèo thứ hai |
| C. Crypto VN có phép | 🟢 chỉ khi sàn có giấy phép chính thức; hiện chưa thấy sàn nào được cấp chính thức ❓ | Thêm sau | ⏸ Chờ |
| D. Forex/crypto nước ngoài | 🟠 vùng xám (khách nước ngoài), 🔴 (người Việt) | Không | ⛔ Giữ lại, cần luật sư |
| E. Wise, Revolut | 🟢 | Nhập bảng kèo tay | ✅ Cắm được (mẫu bài tiếng Anh) |
| F. Phần mềm, khóa học | 🟢 | Nhập bảng kèo tay | ✅ Cắm được |

Mọi nguồn kèo dùng chung: bảng kèo (tên, link gốc, tiền/lượt, điều kiện tính lượt), mẫu bài, bộ kiểm tra luật, báo cáo.

---

## 4. Công nghệ em chọn (anh không cần biết code)

| Việc | Công cụ | Vì sao |
|---|---|---|
| Ngôn ngữ | Python | Có sẵn thư viện gọi API, xử lý ảnh/video |
| Chạy mỗi ngày | GitHub Actions (có sẵn trong kho code này) | Miễn phí cho dự án nhỏ, không cần máy chủ ❓ |
| Lưu dữ liệu | Tệp CSV/JSON trong kho code | Anh đọc được bằng Excel |
| Khóa API | Lưu trong phần bí mật của GitHub, không để trong code | An toàn |
| Đầu ra mỗi ngày | Thư mục `output/YYYY-MM-DD/` gồm video, caption, link, báo cáo | Anh chỉ việc lấy gói bài |

---

## 5. Luật lời/lỗ cho quảng cáo (máy tính tự áp dụng)

```
Giá click tối đa chịu được = tiền mỗi kết quả × tỉ lệ click ra kết quả (đo từ báo cáo thật)
```
- Shopee giả định 2%: ~88đ/click → khuyến nghị **không chạy ads**.
- Tài chính (ví dụ HDBank 180.000đ, tỉ lệ 1–3%): 1.800–5.400đ/click → có thể dương.
- Trần lỗ 500k, mỗi lần thử tối đa 100k, 0 kết quả sau 100k thì dừng. Máy chỉ khuyến nghị, người quyết định.

---

## 6. Rủi ro và điều chưa biết (không giấu)

| # | Điều chưa biết | Hậu quả nếu sai | Cách xử |
|---|---|---|---|
| 1 | Tài khoản của anh có được cấp AppId/Secret cho Shopee Open API không ❓ | Mô-đun 1, 2, 6 của Shopee không gọi được API | Chuyển sang chế độ nhập CSV từ app/web, workflow vẫn chạy |
| 2 | Shopee Video không có API đăng ❓ | Bước đăng Shopee Video phải làm tay | Mô-đun 5 xuất "gói bài" sẵn sàng, đăng tay vài chục giây mỗi bài |
| 3 | TikTok/YouTube bị ép riêng tư khi chưa qua kiểm duyệt app | Đăng tự động không công khai được | Làm kiểm duyệt app sau; trước mắt đăng tay |
| 4 | Máy em dựng code có truy cập được API thật không ❓ (nhiều trang tra cứu bị chặn mạng) | Em chỉ kiểm thử bằng dữ liệu giả, chưa chạm API thật | Kiểm thử thật chạy trên GitHub Actions khi có khóa |
| 5 | Chính sách dùng ảnh sản phẩm làm video ❓ | Video bị gỡ | Dùng ảnh từ dữ liệu kèo chính thức; kiểm điều khoản ở ngày 3 |
| 6 | Hoa Hồng Xtra áp dụng cho Lv.0 thế nào ❓ | Tính lời sai | Máy đọc tỉ lệ thật từ API thay vì tính tay |

---

## 7. Kế hoạch build 7 ngày (mỗi ngày có đầu ra kiểm được)

| Ngày | Xây | Đầu ra kiểm bằng bài test |
|---|---|---|
| 1 | Khung dự án + cấu hình + Mô-đun 1 (nhặt kèo: API + CSV dự phòng + chấm điểm) | Nhập 20 kèo mẫu → ra danh sách xếp hạng đúng thứ tự |
| 2 | Mô-đun 2 (tạo link kèm mã riêng) + Mô-đun 4 (kiểm tra luật) | Bài thiếu nhãn/có từ cấm bị chặn; bài hợp lệ qua |
| 3 | Mô-đun 3 (kịch bản, caption, ghép video dọc) | Từ 1 kèo ra 1 video 9:16 + caption đúng mẫu |
| 4 | Mô-đun 6 (báo cáo) | Nhập dữ liệu chuyển đổi mẫu → ra bảng click/đơn/hoa hồng theo bài |
| 5 | Mô-đun 7 (tự điều chỉnh + máy tính hòa vốn) | Cho số mẫu → ra đúng quyết định giữ/bỏ/khuyến nghị ads |
| 6 | Mô-đun 5 (gói bài, lịch) + Mô-đun 8 (điều phối, nhật ký) | Chạy 1 lệnh ra đủ `output/ngày/` |
| 7 | Chạy thử toàn bộ, sửa lỗi, viết hướng dẫn dùng bằng tiếng Việt | Chạy hết luồng 2 ngày liên tiếp bằng dữ liệu mẫu không lỗi |

Khi có khóa API thật, bật chế độ thật thay chế độ dữ liệu mẫu.

---

## 8. Lịch sử trả lời của anh (đã chốt)

| # | Nội dung | Ảnh hưởng |
|---|---|---|
| 1 | Shopee Affiliate đã duyệt; có Shopee Video, Hành Trình Nhà Sáng Tạo Lv.0 | Có tài khoản nguồn kèo |
| 2 | X ít view; FB/TikTok là cá nhân | Không dựa vào khán giả sẵn có |
| 3 | 1–2 giờ/ngày; không lộ mặt, không lộ giọng | Nội dung ẩn danh, ít thao tác tay |
| 4 | Ads tối đa ~500k, không chịu lỗ không kiểm soát | Mục 5 |
| 5 | Tài chính VN hợp pháp, crypto VN sắp có sàn, cần đa dạng | Mục 3 |
| 6 | **7 ngày để dựng workflow tự động nhiều nhất có thể, không bắt buộc ra đơn** | **Kiến trúc v5** |

---

## 9. ĐÁNH GIÁ TỔNG QUAN

- **Có làm ra kết quả thật trong 7 ngày không?** Có, theo định nghĩa của anh: một workflow chạy từ đầu đến cuối, có bài kiểm tra tự động cho từng mô-đun. Em kiểm chứng được bằng dữ liệu mẫu ngay trong máy em.
- **Chưa kiểm chứng được:** gọi API thật (cần khóa của anh và môi trường có mạng ra ngoài), đăng bài tự động công khai (bị khóa bởi kiểm duyệt app và Shopee Video chưa thấy API).
- **Tự động hóa:** 7 trên 8 mô-đun chạy hoàn toàn tự động; bước đăng bài là chỗ còn thủ công.
- **Pháp lý:** mọi bài đều qua bộ kiểm tra nhãn quảng cáo; forex/crypto nước ngoài không đưa vào.


---

## 10. TIẾN ĐỘ BUILD

| Ngày | Mô-đun | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | 1. Nhặt kèo (đọc CSV, lọc, chấm điểm, xếp hạng, ứng dụng gọi Shopee API) | ⚠️ CHỈ CHẠY TRÊN DỮ LIỆU GIẢ, chưa phải kết quả thật | 11/11 bài test qua; lệnh `python3 -m affiliate_flow.cli rank --input data/offers_sample.csv` ra bảng xếp hạng từ 20 kèo mẫu |

**Chưa kiểm chứng ở Ngày 1:** phần gọi Shopee API thật. Code viết theo tài liệu tra cứu và đã test bằng kết nối giả, chưa chạm API thật vì cần AppId/Secret và mạng. Tên trường trả về của API em chưa xác minh, code đọc kiểu phòng thủ (trường thiếu thì bỏ qua, không sập).

**Cách chấm điểm kèo (để anh hiểu máy chọn món gì):**
`điểm = hoa hồng mỗi đơn (có trần 70.000đ) × log(1 + số đã bán) × (sao đánh giá / 5)`
Bộ lọc mặc định: giá 100–250k, sao từ 4.5, đã bán từ 100.
Dữ liệu mẫu `data/offers_sample.csv` là dữ liệu GIẢ (tên có chữ [MAU]), không phải sản phẩm thật.


**Nhận định thẳng (sau phản hồi của anh):** Ngày 1 chạy trên 20 món giả và API chưa chạm thật nên chưa chứng minh được gì về thế giới thật. Mọi mô-đun sau cũng sẽ "ảo" nếu không có dữ liệu thật đi vào. Quy tắc mới: **không build mô-đun nào tiếp cho đến khi có dữ liệu thật đầu vào**, và mỗi bước phải cho ra kết quả trên dữ liệu thật.
