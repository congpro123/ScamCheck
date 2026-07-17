# Ma trận 50 mã backlog

Quy ước: **Đạt bằng mã/test** có thể kiểm tra trong kho; **Cần nghiệm thu ngoài** cần tài khoản, mạng, thiết bị hoặc con người và không được ghi khống.

| Mã | Trạng thái | Minh chứng / việc còn lại |
|---|---|---|
| L1-01 | Đạt bằng mã | `.gitignore`, `.env.example`; cần tạo GitHub và kiểm tra lịch sử commit |
| L1-02 | Đạt bằng mã | `public/index.html`, footer cố định; cần Safari iPhone thật |
| L1-03 | Đạt production bước đầu | `server.js`, JSON schema; 3/3 ca production AI thật đúng cấu trúc, 2,28–2,65 giây; vẫn cần bộ 10 lần chính thức |
| L1-04 | Đạt bằng test | 5 mẫu sai trong `tests/core.test.js` |
| L1-05 | Đạt bằng mã/test | lỗi input/mạng/timeout/API, retry 429 tối đa 2 lần |
| L1-06 | Đạt production | Render public tại `https://scamcheck-vn.onrender.com`, health/frontend/CSS/JS đều HTTP 200 |
| L1-07 | Đạt bằng mã | 6 lượt/phiên, timeout 18 giây, bộ đếm UI |
| L1-08 | Đạt bằng mã | nhật ký localStorage, bảng xem và xuất JSON |
| L2-01 | Đạt bằng mã | prompt Thám tử; cần bộ 30 tin mentor để nghiệm thu 27/30 |
| L2-02 | Đạt bằng mã | thẻ xanh/vàng/đỏ |
| L2-03 | Đạt bằng mã | `highlight`, bỏ qua trích dẫn không tìm thấy |
| L2-04 | Đạt bằng mã | parser luôn trả đúng 3 hành động |
| L2-05 | Đạt bằng mã | lịch sử tối đa 10, xem lại không gọi API |
| L2-06 | Đạt bằng mã | 3 mẫu và spinner |
| L2-07 | Đạt bằng mã/test | validation, URL, prompt injection, nội dung mâu thuẫn và fallback |
| L2-08 | Đạt tự kiểm | `docs/ACCESSIBILITY.md`; còn VoiceOver/iPhone thật |
| L2-09 | Đạt bằng mã | Web Speech API + fallback micro bàn phím |
| L2-10 | Đạt bằng mã | xoá một/tất cả và confirm |
| L3-01 | Đạt bằng mã | prompt và parser giới hạn 2–3 câu |
| L3-02 | Đạt production | gọi tuần tự, hai phần riêng; hai ca nguy hiểm production hoàn tất 2,28–2,37 giây |
| L3-03 | Đạt bằng mã | chỉ gọi khi không An toàn, catch độc lập |
| L3-04 | Đạt bằng test | guard + luật không cho hạ mức |
| L3-05 | Đạt bằng test | 60 mẫu, `npm run evaluate` lớn hơn yêu cầu 20 |
| L3-06 | Đạt bằng mã | 12 thủ đoạn, 4 nhóm, dialog không reload |
| L4-01 | Đạt một phần | tách URL/rút gọn; chưa theo redirect do SSRF, cần dịch vụ sandbox production |
| L4-02 | Đạt bằng test | chuẩn hoá đồng hình + Levenshtein, test 10 tên miền |
| L4-03 | Đạt bằng mã | 7 nhóm luật, merge không mâu thuẫn |
| L4-04 | Đạt bằng dữ liệu | 60 tin cân bằng, 15 tin `hard`, có lý do |
| L4-05 | Đạt baseline | ma trận, accuracy/recall, 3 điểm yếu; cần lượt Gemini thật |
| L4-06 | Chưa đủ số liệu | đã sửa model ngừng hoạt động và giảm latency từ timeout xuống 2,28–2,65 giây; chưa chạy đủ 60 tin AI để chứng minh accuracy trước–sau |
| L4-07 | Đạt bằng mã | 10 câu, điểm, giải thích và tổng kết |
| L4-08 | Chưa đạt hoàn toàn | có trạng thái sớm; chưa stream token Gemini có cấu trúc |
| L4-09 | Đạt bằng mã | cache 30 tin, tin trùng không tăng lượt |
| L5-01 | Đạt bằng mã/tài liệu | `SDT.docx` lưu danh sách đã xác minh; `data/hotlines.json` có 10 ngân hàng, 113, 156, Tổng đài An toàn mạng quốc gia và Phòng An ninh mạng |
| L5-02 | Đạt bằng mã | 4 lựa chọn, chọn xong khoá toàn bộ |
| L5-03 | Đạt bằng mã/test | prompt, bước + câu mẫu, allowlist số |
| L5-04 | Đạt bằng mã/test | 4 kịch bản khác nhau |
| L5-05 | Đạt bằng mã/tài liệu | state flow và số lượt giảm trong `ARCHITECTURE.md` |
| L5-06 | Đạt bằng test | số ngoài allowlist bị ẩn |
| L5-07 | Đạt bằng test/tài liệu | 4 test khủng hoảng, `OPERATIONS.md` |
| L5-08 | Đạt bằng mã | canvas 1080×1080 + QR dẫn về origin |
| L5-09 | Đạt bằng mã | tải PNG; cần thử thư viện ảnh Android/iPhone thật |
| L5-10 | Đạt bằng mã | tương phản/phóng chữ, lưu localStorage |
| N7-01 | Đạt bằng tài liệu | `README.md`; cần điền thông tin nhóm |
| N7-02 | Đạt bằng tài liệu | hai sơ đồ Mermaid khớp luồng |
| N7-03 | Đạt bằng tài liệu | `SLIDES.md`, 9 slide |
| N7-04 | Đạt kịch bản | `DEMO.md`; nhóm cần tập 2 lần |
| N7-05 | Đạt dữ liệu, thiếu ảnh | đã có 3 phản hồi production AI thật và báo cáo baseline; cần chụp màn hình cho slide |
| N7-06 | Cần con người | cần quay video dưới 5 phút |
| N7-07 | Đạt bằng tài liệu | `TECHNICAL_LOG.md` |

## Các chặn còn lại để tuyên bố 50/50

1. Chạy đủ bộ 60 tin qua Gemini để có số accuracy trước–sau chính thức.
2. Chọn dịch vụ sandbox/redirect resolver để giải URL rút gọn mà không tạo lỗ hổng SSRF.
3. Bổ sung stream token Gemini thật thay cho trạng thái tiến trình.
4. Xác minh tổng đài, Safari/VoiceOver, Android, chụp minh chứng, quay video và tập demo bằng thiết bị/người thật.
