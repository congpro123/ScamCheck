# ScamCheck

Ứng dụng web tiếng Việt giúp người lớn tuổi kiểm tra tin nhắn đáng ngờ, hiểu thủ thuật tâm lý và nhận hướng dẫn ứng cứu. Kết quả kết hợp Gemini với lớp luật cục bộ; khi AI lỗi, phần cảnh báo luật vẫn hoạt động.

## Chạy trên máy

1. Cài Node.js 18 trở lên, chạy `npm install`.
2. Sao chép `.env.example` thành `.env`, điền `GEMINI_API_KEY`.
3. Chạy `npm start`, mở `http://localhost:3000`.
4. Chạy kiểm thử bằng `npm test`; đo bộ 60 tin bằng `npm run evaluate`.

Không đưa `.env` lên Git. Nếu không có khoá, ứng dụng chủ động chạy bằng lớp luật để demo giao diện. Node/Express được chọn vì khoá AI phải ở máy chủ, không lộ trong trình duyệt.

## Tính năng hoàn thành

- Thám tử: JSON có cấu trúc, parser chịu lỗi, luật OTP/chuyển tiền/khẩn cấp, soi URL và tên miền giả.
- Cô tâm lý: chỉ chạy với tin Nghi ngờ/Nguy hiểm, lỗi độc lập, 2–3 câu đúng vai.
- Người ứng cứu: bốn tình huống, số tổng đài allowlist, chặn số AI tự sinh.
- Giới hạn 6 lượt AI/phiên, timeout 18 giây, retry 429 tối đa hai lần, cache 30 tin, lịch sử 10 tin, nhật ký phiên.
- Nhập giọng nói, thư viện 12 thủ đoạn, bài luyện 10 câu, tô trích dẫn, tương phản cao, phóng chữ, ảnh chia sẻ PNG.
- 60 mẫu đánh giá cân bằng, trong đó 15 mẫu khó; kiểm thử parser, prompt injection, tên miền và bốn luồng khủng hoảng.

## Triển khai

Đưa mã lên GitHub, cấu hình biến `GEMINI_API_KEY` và lệnh `npm start` trên Render/Railway/Fly.io. GitHub Pages chỉ phục vụ frontend tĩnh và không thể giữ khoá hay chạy API Node an toàn; không bật Pages cho bản có Gemini. Sau khi triển khai, đặt `PUBLIC_URL` thành URL công khai và kiểm tra Safari iPhone thật.

## Giới hạn an toàn

ScamCheck không thay thế ngân hàng/cơ quan chức năng, không tự mở URL, không thu thập danh tính. Danh sách tổng đài cần được nhóm xác minh lại trên trang chính thức ngay trước demo vì số điện thoại có thể thay đổi.

## Nhóm

Điền tên thành viên, vai trò và liên hệ tại đây trước khi nộp.
