# Biên bản chốt phần mềm — 14/07/2026

## Production

- URL: `https://scamcheck-vn.onrender.com`
- Model: `gemini-3.1-flash-lite`; khoá chỉ nằm trong Render Environment.
- Trang, CSS, JavaScript và QR đều trả HTTP 200.
- Ba ca kiểm tra AI thật: An toàn 2,65 giây; giả ngân hàng 2,37 giây; prompt injection 2,28 giây. Cả ba `AI=true`, đúng 3 hành động; hai ca nguy hiểm kích hoạt Cô tâm lý.
- Người ứng cứu tình huống đã chuyển tiền trả 3 bước, chỉ dùng số 113 thuộc allowlist.

## Chất lượng kỹ thuật

- 11/11 automated tests đạt; cú pháp server/frontend hợp lệ.
- 60 mẫu cân bằng, gồm 15 mẫu khó. Baseline lớp luật: accuracy 58,3%, độ phủ cảnh báo Nguy hiểm 85%.
- `npm audit`: 0 lỗ hổng; quét toàn bộ file tracked: 0 API key/token.
- Cache, lịch sử, quota, retry, timeout, parser lỗi, prompt injection, tên miền giả, bốn luồng khủng hoảng và chặn số bịa đều có mã/test.

## Chưa được phép ghi là nghiệm thu hoàn toàn

- L4-01: nhận diện URL rút gọn nhưng chưa theo redirect trong sandbox an toàn.
- L4-06: chưa chạy toàn bộ 60 tin qua Gemini để tính accuracy trước–sau AI.
- L4-08: có phản hồi trạng thái sớm nhưng chưa stream token Gemini thật.
- N7-06: chưa có video do cần người và thiết bị quay.
- Các kiểm tra iPhone/Android/VoiceOver, xác minh lại tổng đài, ảnh minh chứng và hai lần tập demo cần nhóm ký xác nhận.

Không tuyên bố 50/50 cho đến khi các mục trên có bằng chứng. Ma trận từng mã nằm trong `docs/BACKLOG_STATUS.md`.

## Cập nhật kiểm tra ngày 18/07/2026

- 21/21 automated tests đạt, gồm bài test tập trung 12 ca biên và cơ chế retry 429.
- Lớp luật trên bộ 60 tin nội bộ tăng từ 60,0% lên 100,0%; recall Nguy hiểm tăng từ 85,0% lên 100,0%. Đây không phải số đo Gemini trên tập ẩn.
- Đã bổ sung tương phản cao thực sự, chữ nội dung/điều khiển tối thiểu 18px, sửa tràn mobile khi bật A+, ưu tiên Web Share để lưu ảnh trên điện thoại và không tạo ảnh cảnh báo cho kết luận An toàn.
- Báo cáo đối chiếu mới nằm trong `docs/BACKLOG_AUDIT.md`; số liệu trong `docs/EVALUATION_REPORT.md`.
