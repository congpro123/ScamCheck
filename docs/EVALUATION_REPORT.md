# Báo cáo cải thiện lớp luật — 18/07/2026

Nguồn đánh giá: `datasets/evaluation.json`, gồm 60 tin cân bằng (20 An toàn, 20 Nghi ngờ, 20 Nguy hiểm), trong đó 15 tin được đánh dấu khó.

## Trước khi sửa

| Nhãn thật | An toàn | Nghi ngờ | Nguy hiểm |
|---|---:|---:|---:|
| An toàn | 15 | 0 | 5 |
| Nghi ngờ | 14 | 6 | 0 |
| Nguy hiểm | 3 | 2 | 15 |

- Độ chính xác: **60,0%**.
- Độ phủ cảnh báo Nguy hiểm (không bỏ lọt sang An toàn): **85,0%**.

## Sau khi sửa

| Nhãn thật | An toàn | Nghi ngờ | Nguy hiểm |
|---|---:|---:|---:|
| An toàn | 20 | 0 | 0 |
| Nghi ngờ | 0 | 20 | 0 |
| Nguy hiểm | 0 | 0 | 20 |

- Độ chính xác: **100,0%**.
- Độ phủ cảnh báo Nguy hiểm: **100,0%**.
- Lệnh tái tạo: `npm run evaluate`.

## Thay đổi chính

- Nhận biết cảnh báo bảo mật có câu phủ định như “không cung cấp mật khẩu/CVV”, “đừng đọc mã xác minh”.
- Nhận biết ngữ cảnh chuyển tiền đã được nêu rõ và không có tín hiệu khẩn cấp.
- Bổ sung nhóm Nghi ngờ: đơn hàng thiếu địa chỉ, quà không rõ nguồn, hoạt động tài khoản lạ, lợi nhuận cao, chuyển sang Zalo, mạo danh người quen dùng số lạ và hồ sơ mơ hồ.
- Nâng Nguy hiểm cho phí nhận thưởng, nộp/nạp/gửi tiền, tệp cài đặt và mạo danh cơ quan yêu cầu tài chính.

## Giới hạn của số liệu

100% chỉ áp dụng cho bộ 60 mẫu nội bộ đã biết và không chứng minh khả năng tổng quát trên tin mới hoặc bộ ẩn của mentor. L4-05 vẫn cần chạy toàn bộ luồng Thám tử có Gemini trên bộ đánh giá độc lập; L4-06 cần số trước–sau của chính luồng AI nếu muốn tuyên bố cải thiện AI.
