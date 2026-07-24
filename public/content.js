"use strict";

const samples = {
  prize:
    "CHÚC MỪNG! Bạn trúng iPhone 16. Chuyển 499.000đ phí nhận thưởng vào STK 0123456789 trong 30 phút.",
  bank: "Vietcombank: Tài khoản sắp bị khoá. Xác minh ngay tại https://vietcombank-xacminh.com và nhập OTP.",
  safe: "Mẹ ơi, chiều nay con về lúc 6 giờ. Mẹ có cần con mua thêm rau không?",
};
const scams = [
  {
    g: "Giả ngân hàng",
    t: "Khoá tài khoản giả",
    d: "Dọa tài khoản bị khoá để dụ bấm liên kết.",
    sign: "Tên miền gần giống ngân hàng; đòi OTP; thúc giục.",
  },
  {
    g: "Giả ngân hàng",
    t: "Hoàn tiền thẻ",
    d: "Hứa hoàn tiền rồi xin số thẻ và CVV.",
    sign: "Ngân hàng không hỏi OTP/CVV qua tin nhắn.",
  },
  {
    g: "Giả ngân hàng",
    t: "Nâng hạn mức",
    d: "Mời nâng hạn mức qua ứng dụng lạ.",
    sign: "Tệp APK ngoài kho ứng dụng chính thức.",
  },
  {
    g: "Giả công an",
    t: "Liên quan vụ án",
    d: "Dọa có lệnh bắt vì liên quan rửa tiền.",
    sign: "Yêu cầu chuyển tiền “chứng minh trong sạch”.",
  },
  {
    g: "Giả công an",
    t: "Phạt nguội",
    d: "Gửi liên kết đóng phạt giao thông giả.",
    sign: "Đe dọa, tên miền không thuộc .gov.vn.",
  },
  {
    g: "Giả công an",
    t: "Cài định danh điện tử",
    d: "Hướng dẫn cài ứng dụng định danh giả.",
    sign: "Cơ quan nhà nước không gửi APK qua chat.",
  },
  {
    g: "Trúng thưởng",
    t: "Quà từ nhãn hàng",
    d: "Báo trúng quà dù chưa tham gia.",
    sign: "Phải trả phí trước khi nhận quà.",
  },
  {
    g: "Trúng thưởng",
    t: "Giải quay số",
    d: "Giả kết quả quay số may mắn.",
    sign: "Đòi thông tin ngân hàng để “nhận giải”.",
  },
  {
    g: "Trúng thưởng",
    t: "Việc nhẹ hoa hồng",
    d: "Cho lời nhỏ rồi dụ nạp tiền lớn.",
    sign: "Nạp trước để mở nhiệm vụ hoặc rút tiền.",
  },
  {
    g: "Giả giao hàng",
    t: "Thiếu phí vận chuyển",
    d: "Đòi chuyển khoản khoản phí rất nhỏ.",
    sign: "Tài khoản cá nhân lạ, liên kết thanh toán.",
  },
  {
    g: "Giả giao hàng",
    t: "Giao nhầm đơn",
    d: "Xin mã OTP với lý do huỷ đơn.",
    sign: "Shipper không cần OTP ngân hàng.",
  },
  {
    g: "Giả giao hàng",
    t: "Đăng ký hội viên",
    d: "Dụ đăng ký gói giao hàng định kỳ.",
    sign: "Ép chia sẻ màn hình hoặc cài ứng dụng.",
  },
];
const quizData = [
  [
    "Ngân hàng: OTP 482911 của quý khách, tuyệt đối không cung cấp cho bất kỳ ai.",
    "safe",
    "Đây là cảnh báo bảo mật, không yêu cầu gửi OTP.",
  ],
  [
    "Công an yêu cầu bác chuyển 20 triệu vào tài khoản an toàn để xác minh.",
    "scam",
    "Cơ quan công an không yêu cầu chuyển tiền để điều tra.",
  ],
  [
    "Bưu tá gọi báo đơn hàng 120.000đ bác đã đặt và cho phép kiểm tra hàng trước.",
    "safe",
    "Không có yêu cầu bất thường; vẫn nên đối chiếu đơn đã đặt.",
  ],
  [
    "Tài khoản sắp khoá, đăng nhập vietcornbank.com ngay.",
    "scam",
    "Tên miền dùng “rn” giả chữ “m” và tạo áp lực.",
  ],
  [
    "Con đổi số mới, mẹ chuyển tiền học phí ngay giúp con.",
    "scam",
    "Mạo danh người thân và thúc chuyển tiền; cần gọi số cũ xác minh.",
  ],
  [
    "Lịch khám của bác lúc 9:00 ngày mai tại phòng khám quen.",
    "safe",
    "Đây là thông báo lịch hẹn, không đòi dữ liệu hay tiền.",
  ],
  [
    "Chúc mừng trúng xe máy, đóng 2 triệu phí hồ sơ để nhận.",
    "scam",
    "Giải thưởng bất ngờ kèm phí trả trước là dấu hiệu điển hình.",
  ],
  [
    "Mã giao dịch của quý khách thành công. Nếu không phải bạn, gọi số sau thẻ.",
    "safe",
    "Khuyến nghị dùng số chính thức trên thẻ, không đưa liên kết lạ.",
  ],
  [
    "Cài file VNeID.apk này để cán bộ hỗ trợ đồng bộ.",
    "scam",
    "Không cài APK được gửi qua chat; có nguy cơ chiếm thiết bị.",
  ],
  [
    "Bạn Lan gửi ảnh họp lớp và hỏi bác có tham dự không.",
    "safe",
    "Trao đổi cá nhân bình thường, không có yêu cầu nhạy cảm.",
  ],
];
const quizMeta = [
  {
    sender: "Ngân hàng của bác",
    detail: "Brandname NGANHANG",
    channel: "Tin nhắn SMS",
    time: "Hôm nay · 08:42",
    focus: "Giữ kín mã OTP",
    hint: "Tin này chỉ nhắc bác giữ kín, hay đang xin bác gửi mã OTP?",
    lessonTitle: "OTP chỉ để bác tự dùng",
    clues: [
      "Chỉ nhắc không chia sẻ OTP",
      "Không có đường dẫn hoặc yêu cầu trả lời",
      "Người gửi không hỏi thông tin bí mật",
    ],
    safeAction:
      "Không gửi OTP cho bất kỳ ai. Nếu bác không thực hiện giao dịch, hãy tự mở ứng dụng ngân hàng để kiểm tra.",
  },
  {
    sender: "Người tự xưng công an",
    detail: "Số lạ · 09•• ••• 318",
    channel: "Cuộc gọi đã chép lại",
    time: "Hôm nay · 09:15",
    focus: "Yêu cầu chuyển tiền",
    hint: "Công an có yêu cầu bác chuyển tiền để chứng minh trong sạch không?",
    lessonTitle: "Không có “tài khoản an toàn” để điều tra",
    clues: [
      "Tự xưng công an qua số lạ",
      "Yêu cầu chuyển ngay 20 triệu đồng",
      "Dùng cụm từ “tài khoản an toàn”",
    ],
    safeAction:
      "Cúp máy, không chuyển tiền và tự gọi cơ quan công an qua số chính thức nếu cần xác minh.",
  },
  {
    sender: "Bưu tá giao hàng",
    detail: "Đơn dự kiến · 120.000đ",
    channel: "Cuộc gọi giao hàng",
    time: "Hôm nay · 10:06",
    focus: "Kiểm tra đơn đã đặt",
    hint: "Bác có đặt đúng món và đúng số tiền 120.000đ này không?",
    lessonTitle: "Đơn hàng thật vẫn cần đối chiếu",
    clues: [
      "Cho phép kiểm tra hàng trước",
      "Không xin OTP hoặc mật khẩu",
      "Số tiền cần khớp với đơn đã đặt",
    ],
    safeAction:
      "Đối chiếu tên món, số tiền và người bán trước khi nhận. Không cung cấp OTP cho bưu tá.",
  },
  {
    sender: "VCB-HOTRO",
    detail: "Tin nhắn từ số lạ",
    channel: "Tin nhắn kèm tên miền",
    time: "Hôm nay · 11:24",
    focus: "Tên miền giả",
    hint: "Nhìn kỹ “vietcornbank”: chữ “r” và “n” có đang giả chữ “m” không?",
    lessonTitle: "Đọc tên miền từng chữ",
    clues: [
      "Tên miền “vietcornbank” giả chữ “m” bằng “rn”",
      "Dọa tài khoản sắp bị khóa",
      "Thúc bấm vào trang đăng nhập lạ",
    ],
    safeAction:
      "Không mở trang trong tin nhắn. Hãy tự mở ứng dụng ngân hàng hoặc gọi số in trên thẻ.",
  },
  {
    sender: "Người tự xưng là con",
    detail: "Số mới · 08•• ••• 527",
    channel: "Tin nhắn cá nhân",
    time: "Hôm nay · 13:02",
    focus: "Mạo danh người thân",
    hint: "Bác có thể gọi lại số cũ hoặc hỏi điều chỉ người nhà biết không?",
    lessonTitle: "Số mới phải xác minh lại",
    clues: [
      "Đột ngột báo đổi số điện thoại",
      "Thúc chuyển học phí ngay",
      "Chưa có cách nào chứng minh đúng là người thân",
    ],
    safeAction:
      "Gọi lại số cũ hoặc gọi video. Chỉ chuyển tiền sau khi đã nghe đúng giọng và xác minh rõ.",
  },
  {
    sender: "Phòng khám quen",
    detail: "Tổng đài đã lưu trong danh bạ",
    channel: "Tin nhắn nhắc lịch",
    time: "Hôm nay · 14:10",
    focus: "Thông báo bình thường",
    hint: "Tin có đòi tiền, mật khẩu hoặc yêu cầu bấm đường dẫn lạ không?",
    lessonTitle: "Kiểm tra điều tin nhắn yêu cầu",
    clues: [
      "Lịch hẹn khớp nơi bác thường khám",
      "Không đòi tiền hoặc thông tin bí mật",
      "Không có đường dẫn hay tệp cài đặt",
    ],
    safeAction:
      "Đối chiếu lịch đã đặt. Nếu thông tin không khớp, gọi số phòng khám bác đã lưu để hỏi lại.",
  },
  {
    sender: "KHO-QUA-TANG",
    detail: "Số quảng cáo chưa xác minh",
    channel: "Tin nhắn quảng cáo",
    time: "Hôm nay · 15:36",
    focus: "Phí nhận thưởng",
    hint: "Bác có tham gia quay thưởng không, và vì sao phải trả tiền trước?",
    lessonTitle: "Không đóng phí để nhận quà bất ngờ",
    clues: [
      "Báo trúng dù bác không tham gia",
      "Đòi đóng 2 triệu đồng trước",
      "Dùng phần thưởng lớn để làm bác mất cảnh giác",
    ],
    safeAction:
      "Không trả bất kỳ khoản phí nào. Chặn người gửi và báo tin nhắn rác hoặc lừa đảo.",
  },
  {
    sender: "Ngân hàng của bác",
    detail: "Brandname NGANHANG",
    channel: "Tin nhắn giao dịch",
    time: "Hôm nay · 16:18",
    focus: "Kênh liên hệ chính thức",
    hint: "Tin đưa đường dẫn lạ, hay chỉ nhắc bác gọi số in trên thẻ?",
    lessonTitle: "Tự gọi số chính thức khi nghi ngờ",
    clues: [
      "Không đưa đường dẫn đăng nhập",
      "Hướng dẫn dùng số ở mặt sau thẻ",
      "Không xin OTP, mật khẩu hoặc chuyển tiền",
    ],
    safeAction:
      "Nếu giao dịch không phải của bác, tự gọi số trên thẻ hoặc trong ứng dụng chính thức để khóa giao dịch.",
  },
  {
    sender: "Người tự xưng cán bộ",
    detail: "Tài khoản Zalo chưa xác minh",
    channel: "Tin nhắn kèm tệp",
    time: "Hôm nay · 17:05",
    focus: "Tệp cài đặt lạ",
    hint: "VNeID chính thức phải tải từ kho ứng dụng hay từ tệp gửi qua chat?",
    lessonTitle: "Không cài tệp APK được gửi qua chat",
    clues: [
      "Gửi tệp “VNeID.apk” qua trò chuyện",
      "Tự xưng cán bộ nhưng tài khoản chưa xác minh",
      "Đòi cài ứng dụng ngoài kho chính thức",
    ],
    safeAction:
      "Không mở tệp. Xóa tệp và chỉ tải VNeID từ App Store hoặc Google Play chính thức.",
  },
  {
    sender: "Bạn Lan",
    detail: "Liên hệ đã lưu trong danh bạ",
    channel: "Tin nhắn cá nhân",
    time: "Hôm nay · 18:20",
    focus: "Trò chuyện bình thường",
    hint: "Tin có xin tiền, OTP, mật khẩu hoặc gửi đường dẫn lạ không?",
    lessonTitle: "Không phải tin nhắn nào cũng là lừa đảo",
    clues: [
      "Nội dung phù hợp cuộc họp lớp",
      "Không xin tiền hay thông tin bí mật",
      "Không thúc ép hoặc đe dọa hậu quả",
    ],
    safeAction:
      "Bác có thể trả lời bình thường. Nếu sau đó xuất hiện yêu cầu tiền hoặc đường dẫn lạ, hãy xác minh lại.",
  },
];
const improvementTips = [
  "Lần sau, hãy phân biệt tin nhắn chỉ cảnh báo bảo mật với tin nhắn yêu cầu cung cấp mã OTP.",
  "Gặp yêu cầu chuyển tiền để xác minh hoặc điều tra, hãy dừng lại và tự gọi cơ quan qua số chính thức.",
  "Hãy đối chiếu đơn đã đặt; chỉ nhận hàng khi thông tin khớp và không cung cấp OTP hay dữ liệu ngân hàng.",
  "Hãy đọc tên miền từng ký tự và mở ứng dụng ngân hàng chính thức thay vì bấm liên kết trong tin nhắn.",
  "Khi người thân dùng số mới và giục chuyển tiền, hãy gọi lại số cũ hoặc hỏi một chi tiết riêng để xác minh.",
  "Hãy kiểm tra xem thông báo có chỉ nhắc lịch hẹn hay còn đòi tiền, dữ liệu hoặc yêu cầu bấm liên kết lạ.",
  "Hãy nhớ quy tắc: không đóng phí trước để nhận một giải thưởng mà mình không chủ động tham gia.",
  "Khi nghi ngờ giao dịch, chỉ gọi số trên thẻ hoặc trong ứng dụng ngân hàng chính thức.",
  "Chỉ cài ứng dụng từ kho chính thức; tuyệt đối không mở tệp APK được gửi qua tin nhắn.",
  "Hãy rà lại bốn dấu hiệu: đòi tiền, hỏi OTP hoặc mật khẩu, tạo áp lực và gửi liên kết lạ.",
];
