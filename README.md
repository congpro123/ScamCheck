# ScamCheck

REST API đơn giản được xây dựng bằng Express.js.

## Cài đặt và chạy

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` để xem giao diện hoặc kiểm tra API tại
`http://localhost:3000/api/health`.

## Endpoints

- `GET /api/health` — kiểm tra trạng thái server
- `GET /api/checks` — lấy tất cả kết quả
- `GET /api/checks/:id` — lấy một kết quả
- `POST /api/checks` — tạo kết quả mới
- `PUT /api/checks/:id` — cập nhật kết quả
- `DELETE /api/checks/:id` — xóa kết quả

Ví dụ tạo dữ liệu:

```bash
curl -X POST http://localhost:3000/api/checks \
  -H "Content-Type: application/json" \
  -d '{"content":"Nội dung cần kiểm tra"}'
```

Lưu ý: dữ liệu hiện được lưu trong bộ nhớ và sẽ mất khi khởi động lại server.
