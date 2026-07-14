# Vận hành và tự đánh giá an toàn

## Trước demo

- Kiểm tra `.env` không nằm trong Git; gọi `/api/health` thấy `configured: true`.
- Đối chiếu từng số trong `data/hotlines.json` với website chính thức và ghi ngày kiểm tra.
- Chạy `npm test` và `npm run evaluate`; thử Safari iPhone, micro, tải PNG.
- Thử bốn lựa chọn ứng cứu và một mẫu prompt injection.

## Khi có lỗi

- Gemini lỗi/timeout: UI vẫn hiện lớp luật và thông báo lịch sự.
- 429: server tự chờ 0,5 giây rồi 1 giây, tổng cộng tối đa ba lần gọi.
- Cô tâm lý lỗi: Thám tử vẫn hiển thị. Người ứng cứu lỗi: dùng kịch bản cục bộ.
- Không mở hoặc giải URL từ máy chủ để tránh SSRF; bản này nhận diện URL rút gọn và cảnh báo người dùng. Việc theo redirect phải dùng dịch vụ sandbox allowlist ở bản sản xuất.

## Tự đánh giá

Khoá nằm phía server; dữ liệu không được lưu server; frontend dùng textContent/escape trước khi render; giới hạn input 6.000 ký tự; số điện thoại được lọc allowlist. Rủi ro còn lại: AI có thể phân loại sai, số chính thức có thể đổi, Web Speech trên iOS phụ thuộc phiên bản/trình duyệt.
