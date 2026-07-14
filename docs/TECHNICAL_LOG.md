# Nhật ký kỹ thuật và phân định AI

| Hạng mục | AI hỗ trợ sinh | Nhóm phải hiểu/chỉnh/xác minh |
|---|---|---|
| Prompt ba nhân vật | Bản nháp vai và schema | Ràng buộc injection, giọng, điều kiện gọi |
| Luật phát hiện | Gợi ý biểu thức | Kiểm thử false positive và không hạ mức luật |
| Bộ dữ liệu | Gợi ý tình huống | Nhãn, cân bằng, lý do và 15 ca khó |
| Tổng đài | Không được tin AI | Nhóm xác minh trực tiếp nguồn chính thức |
| UI/nội dung | Bản nháp | Tiếp cận iPhone, ngôn ngữ người lớn tuổi |

Quyết định khó: không theo redirect URL trực tiếp vì nguy cơ SSRF; cache theo hash nhẹ chỉ để nhận dạng cục bộ, không dùng cho bảo mật; fallback luật luôn hoạt động để demo không phụ thuộc mạng. Nhật ký cuộc gọi nằm tại `localStorage.scamcheck_logs` và có thời điểm, độ dài, rủi ro, số dấu hiệu, thời gian, trạng thái AI.
