# Kiến trúc và máy trạng thái

```mermaid
flowchart LR
  UI[Web iPhone] --> Cache{Cache?}
  Cache -- có --> Result[Kết quả]
  Cache -- không --> API[Express API]
  API --> Rules[Lớp luật + URL/domain]
  API --> Detective[Gemini Thám tử]
  Detective --> Merge[Ghép, không hạ cảnh báo luật]
  Rules --> Merge
  Merge --> Risk{Mức rủi ro}
  Risk -- An toàn --> Result
  Risk -- Nghi ngờ/Nguy hiểm --> Psych[Cô tâm lý]
  Psych --> Result
  Result --> Choice[4 lựa chọn]
  Choice --> Responder[Người ứng cứu + allowlist tổng đài]
```

```mermaid
stateDiagram-v2
  [*] --> NhậpTin
  NhậpTin --> KiểmTraCache
  KiểmTraCache --> HiệnKếtQuả: trùng
  KiểmTraCache --> ThámTử: mới và còn lượt
  ThámTử --> CôTâmLý: nghi ngờ/nguy hiểm
  ThámTử --> HiệnKếtQuả: an toàn hoặc cô lỗi
  CôTâmLý --> HiệnKếtQuả
  HiệnKếtQuả --> NgườiỨngCứu: chọn tình huống
  NgườiỨngCứu --> HoànTất
```

Cách gọi ngây thơ luôn gọi ba nhân vật: 3 lượt/tin. Máy trạng thái gọi 1 lượt cho tin an toàn, 2 lượt cho tin đáng ngờ và chỉ gọi lượt thứ ba khi người dùng yêu cầu ứng cứu; giảm 33–67% ở luồng phân tích.
