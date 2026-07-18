# Kiểm tra backlog ScamCheck — 18/07/2026

Nguồn tiêu chí: `[FCT] Backlog Hackathon ScamCheck.xlsx`. Trạng thái chỉ được ghi “Đạt” khi có bằng chứng trong mã, test hoặc lệnh chạy; mục cần thiết bị, tài khoản, mạng hay con người được tách riêng.

| Mã | Trạng thái | Kết luận kiểm tra |
|---|---|---|
| L1-01 | Đạt bằng mã/lịch sử | `.gitignore`, `.env.example`; `.env` không được track và không thấy mẫu khoá Gemini trong lịch sử Git đã quét. |
| L1-02 | Cần nghiệm thu ngoài | Có textarea, nút kiểm tra, footer pháp lý và responsive; vẫn cần Safari iPhone thật. |
| L1-03 | Đạt một phần | Gemini bất đồng bộ + schema JSON + timeout; chưa có bài chạy chính thức 10 lần để chứng minh ≥9/10. |
| L1-04 | Đạt bằng test | Parser chịu 5 phản hồi sai định dạng và luôn trả object hợp lệ. |
| L1-05 | Đạt bằng test | Có 12 ca biên; retry 429 được test đúng 500ms, 1000ms và tối đa 2 lần thử lại. |
| L1-06 | Đạt vận hành hiện tại | Trang công khai và `/api/health` hoạt động ngày 18/07/2026; sửa đổi trong workspace chưa được triển khai. |
| L1-07 | Đạt một phần | UI giới hạn 6 lượt kiểm tra và có timeout; bộ đếm còn ở client, chưa phải hạn mức cứng theo từng lần gọi model trên server. |
| L1-08 | Đạt một phần | Có bảng và xuất JSON; log hiện ghi theo lần phân tích, chưa tách từng lượt Thám tử/Cô tâm lý/Người ứng cứu. |
| L2-01 | Cần nghiệm thu ngoài | Prompt đúng vai/schema; chưa có bộ 30 tin ẩn của mentor để chứng minh 27/30. |
| L2-02 | Đạt bằng mã | Thẻ xanh/vàng/đỏ theo đúng ba mức. |
| L2-03 | Đạt bằng mã | Tô đoạn trích tại vị trí tìm thấy; bỏ qua khi không khớp. |
| L2-04 | Đạt bằng mã/test | Parser luôn đủ 3 hành động; cỡ chữ hành động tối thiểu 18px. |
| L2-05 | Đạt bằng mã | Lịch sử tối đa 10, xem lại dùng dữ liệu lưu và không gọi API. |
| L2-06 | Đạt bằng mã | Ba tin mẫu và trạng thái chờ hoạt động. |
| L2-07 | Đạt bằng test | Có bài test tập trung đúng 12 ca, gồm link/tệp độc hại và tiêu đề–thân mâu thuẫn. |
| L2-08 | Đạt mã, cần thiết bị | Nội dung/điều khiển ≥18px, mobile 360px không tràn, focus/ARIA và tương phản cao; còn VoiceOver/iPhone thật. |
| L2-09 | Cần nghiệm thu ngoài | Web Speech API + fallback micro bàn phím; iPhone Safari phụ thuộc hỗ trợ hệ điều hành/trình duyệt. |
| L2-10 | Đạt bằng mã | Xoá một/tất cả và có xác nhận. |
| L3-01 | Đạt bằng mã/test | Prompt đúng giọng; parser giới hạn 2–3 câu. |
| L3-02 | Đạt bằng mã | Gọi tuần tự; toàn luồng phân tích được chặn ở 19,5 giây và hai phần tách riêng. |
| L3-03 | Đạt bằng mã | Chỉ gọi Cô tâm lý khi không An toàn; lỗi được bắt độc lập. |
| L3-04 | Đạt bằng test | Guard prompt + luật không cho AI hạ cảnh báo chắc chắn. |
| L3-05 | Đạt bằng dữ liệu/lệnh | Có 60 tin gán nhãn và `npm run evaluate`. |
| L3-06 | Đạt bằng mã | 12 kiểu, 4 nhóm, lọc và dialog không tải lại trang. |
| L4-01 | Chưa đạt hoàn toàn | Tách và cảnh báo URL rút gọn nhưng chưa giải redirect; cần resolver sandbox/allowlist chống SSRF. |
| L4-02 | Đạt bằng test | Đồng hình + Levenshtein, phủ 10 tên miền giả. |
| L4-03 | Đạt bằng mã/test | Luật OTP, tài chính, khẩn cấp, phần thưởng, cơ quan, tệp, bí mật và nhóm nghi ngờ; merge không hạ mức. |
| L4-04 | Đạt bằng dữ liệu | 60 tin cân bằng, 15 tin khó, mỗi tin có lý do. |
| L4-05 | Đạt một phần | Có ma trận/accuracy/recall cho lớp luật; chưa chạy đủ 60 tin qua Gemini/Thám tử hoàn chỉnh. |
| L4-06 | Đạt cho logic cục bộ | Lớp luật tăng 60,0% → 100,0%, recall Nguy hiểm 85,0% → 100,0%; chưa có số trước–sau Gemini trên tập độc lập. |
| L4-07 | Đạt bằng mã | 10 câu, chấm điểm, giải thích và gợi ý cải thiện. |
| L4-08 | Chưa đạt | Chỉ có trạng thái tiến trình; chưa stream token/kết quả Gemini trong 3 giây đầu. |
| L4-09 | Đạt bằng mã | Cache tối đa 30 tin, tin trùng không tăng lượt kiểm tra. |
| L5-01 | Cần xác minh lại | Có 10 ngân hàng + các đầu số; 156 đã đối chiếu nguồn chính thức, các số còn lại cần URL nguồn cụ thể và ngày xác minh. |
| L5-02 | Đạt bằng mã | Bốn lựa chọn chỉ hiện với kết quả có rủi ro; chọn xong khoá toàn bộ. |
| L5-03 | Đạt bằng mã/test | Prompt bước + câu mẫu; số bị lọc bằng allowlist. |
| L5-04 | Đạt bằng mã/test | Bốn playbook khác nhau, có fallback cục bộ. |
| L5-05 | Đạt một phần | Luồng có điều kiện và sơ đồ; mã chưa biểu diễn bằng một state-machine module độc lập, số lượt AI mới là ước lượng kiến trúc. |
| L5-06 | Đạt bằng test | Số ngoài allowlist bị ẩn. |
| L5-07 | Đạt bằng test/tài liệu | Test đủ bốn tình huống và có hướng dẫn vận hành. |
| L5-08 | Đạt bằng mã | Kết quả Nghi ngờ/Nguy hiểm có canvas 1080×1080 + QR; An toàn không tạo ảnh cảnh báo. |
| L5-09 | Đạt mã, cần thiết bị | Ưu tiên Web Share file trên iPhone/Android, fallback tải PNG; cần thử lưu vào thư viện ảnh thật. |
| L5-10 | Đạt mã, cần thiết bị | Có chế độ tương phản cao riêng, A+/A− và lưu lựa chọn; mobile 360px đã qua kiểm tra, còn iPhone thật. |
| N7-01 | Chưa đủ nội dung | README đủ mô tả/cách chạy/tính năng nhưng mục thông tin nhóm còn để trống. |
| N7-02 | Đạt bằng tài liệu | Có sơ đồ luồng dữ liệu và trạng thái khớp nhánh chính. |
| N7-03 | Đạt một phần | Có 9 trang nội dung Markdown; chưa có file trình chiếu hoàn chỉnh và cần cập nhật số đo mới khi làm slide thật. |
| N7-04 | Cần con người | Có kịch bản 3–5 phút; chưa có xác nhận tập hai lần. |
| N7-05 | Đạt một phần | Có phản hồi production cũ và báo cáo lớp luật; thiếu ảnh chụp ba phản hồi và báo cáo Gemini 60 tin. |
| N7-06 | Chưa đạt | Chưa có video dự phòng dưới 5 phút. |
| N7-07 | Đạt bằng tài liệu | Có nhật ký phân định AI và quyết định kỹ thuật. |

## Việc chưa thể tự hoàn tất trong workspace

1. L4-01: chọn và cấu hình resolver redirect an toàn chống SSRF.
2. L4-05/L4-06: cấp ngân sách/API để chạy Gemini trên bộ độc lập và lưu số trước–sau.
3. L4-08: đổi giao thức backend/frontend sang streaming thật.
4. L1-02, L2-08, L2-09, L5-09, L5-10: nghiệm thu Safari/VoiceOver/micro/lưu ảnh trên thiết bị thật.
5. L5-01: xác minh lại từng tổng đài với URL nguồn chính thức và ngày kiểm tra.
6. N7-01, N7-04, N7-05, N7-06: thông tin nhóm, tập demo, ảnh minh chứng và video cần người thực hiện.
