(function attachSimulationData(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ScamSimulation = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSimulationData() {
  'use strict';

  const endings = {
    safe: {
      tone: 'safe',
      title: 'Bác đã phá được kịch bản',
      body: 'Bác dừng cuộc trò chuyện và tự xác minh qua một kênh độc lập. Kẻ giả mạo không còn kiểm soát được nhịp độ.',
    },
    recover: {
      tone: 'suspect',
      title: 'Đã dừng lại — cần xử lý tiếp',
      body: 'Bác đã tiếp xúc với đường dẫn hoặc cung cấp một phần thông tin, nhưng đã dừng trước khi hậu quả nghiêm trọng hơn.',
    },
    danger: {
      tone: 'danger',
      title: 'Kẻ lừa đảo đã đạt mục đích',
      body: 'Quyết định trong mô phỏng đã trao tiền, thông tin hoặc quyền kiểm soát thiết bị cho kẻ xấu. Đây là lúc cần ứng cứu ngay.',
    },
  };

  const scenarios = {
    family: {
      title: 'Người thân cần tiền gấp',
      category: 'Giả mạo người thân',
      description: 'Một số điện thoại lạ tự nhận là con của bác và báo đang gặp tai nạn.',
      difficulty: 'Trung bình',
      duration: '3–4 phút',
      avatar: 'N',
      sender: 'Số lạ',
      start: 'f1',
      lessons: [
        'Gọi lại số cũ hoặc một người thân khác, không xác minh trong chính cuộc trò chuyện đáng ngờ.',
        'Video ngắn và giọng nói quen không đủ chứng minh danh tính vì có thể bị giả mạo.',
        'Yêu cầu giữ bí mật và chuyển tiền gấp là hai dấu hiệu nguy hiểm đi cùng nhau.',
      ],
      nodes: {
        f1: {
          message: 'Mẹ ơi, con đổi số mới. Con vừa gặp tai nạn, điện thoại cũ bị vỡ. Mẹ trả lời con ngay nhé!',
          signals: ['Số điện thoại mới', 'Tạo hoảng loạn'],
          choices: [
            { text: 'Mẹ sẽ gọi lại số cũ của con để xác minh.', reply: 'Mẹ sẽ gọi lại số cũ của con trước.', feedback: 'Rất tốt. Bác chuyển sang một kênh do chính mình kiểm soát.', delta: 25, ending: 'safe' },
            { text: 'Con đang ở đâu? Có chuyện gì?', reply: 'Con đang ở đâu? Có chuyện gì?', feedback: 'Câu hỏi hợp lý, nhưng bác vẫn đang để người lạ dẫn dắt trong cùng cuộc trò chuyện.', delta: 0, next: 'f2' },
            { text: 'Đọc mật khẩu gia đình của mình đi.', reply: 'Con đọc mật khẩu gia đình của mình đi.', feedback: 'Một câu hỏi bí mật tốt hơn việc chỉ nghe giọng, nhưng cần dừng lại nếu đối phương né tránh.', delta: 10, next: 'f2secret' },
          ],
        },
        f2: {
          message: 'Con đang ở bệnh viện. Bác sĩ bắt đóng 8 triệu ngay mới làm thủ tục. Mẹ chuyển giúp con, đừng gọi ai vì con đang rất đau!',
          signals: ['Đòi chuyển tiền', 'Thúc ép thời gian', 'Yêu cầu giữ bí mật'],
          choices: [
            { text: 'Cho mẹ tên bệnh viện; mẹ tự tìm số chính thức để gọi.', reply: 'Cho mẹ tên bệnh viện. Mẹ sẽ tự gọi số chính thức.', feedback: 'Chính xác. Bác kiểm tra bằng nguồn độc lập thay vì dùng số họ cung cấp.', delta: 20, ending: 'safe' },
            { text: 'Gọi video để mẹ nhìn thấy con.', reply: 'Con gọi video cho mẹ xem.', feedback: 'Video giúp có thêm thông tin nhưng không phải bằng chứng tuyệt đối. Kẻ xấu có thể dùng video cũ hoặc deepfake.', delta: 5, next: 'f3video' },
            { text: 'Gửi số tài khoản, mẹ chuyển ngay.', reply: 'Gửi số tài khoản, mẹ chuyển ngay.', feedback: 'Nguy hiểm. Việc nhận yêu cầu chuyển tiền trước khi xác minh làm bác tiến sâu vào bẫy.', delta: -25, next: 'f3money' },
          ],
        },
        f2secret: {
          message: 'Con đau quá nên không nhớ mấy chuyện đó đâu. Mẹ đừng hỏi nữa, cứu con trước đi. Chuyển 8 triệu giúp con!',
          signals: ['Né xác minh', 'Đòi chuyển tiền', 'Thúc ép thời gian'],
          choices: [
            { text: 'Không đúng mật khẩu. Mẹ gọi số cũ và người nhà ngay.', reply: 'Không đúng mật khẩu. Mẹ sẽ gọi số cũ và người nhà.', feedback: 'Bác nhận ra hành vi né xác minh và dừng đúng lúc.', delta: 20, ending: 'safe' },
            { text: 'Vậy cho mẹ nói chuyện với bác sĩ.', reply: 'Cho mẹ nói chuyện với bác sĩ.', feedback: 'Có thêm người xuất hiện chưa chắc là an toàn; đồng bọn có thể đóng vai. Hãy tự gọi bệnh viện.', delta: 5, next: 'f3doctor' },
            { text: 'Được rồi, gửi tài khoản cho mẹ.', reply: 'Được rồi, gửi tài khoản cho mẹ.', feedback: 'Kẻ xấu đã dùng cảm giác tội lỗi để vượt qua bước xác minh của bác.', delta: -20, next: 'f3money' },
          ],
        },
        f3video: {
          message: 'Con vừa gọi video rồi mà mạng yếu nên tắt. Mẹ thấy mặt con rồi thì chuyển đi, chậm là nguy hiểm!',
          signals: ['Video quá ngắn', 'Tiếp tục thúc ép'],
          choices: [
            { text: 'Mẹ vẫn gọi lại số cũ hoặc người thân khác.', reply: 'Mẹ vẫn sẽ gọi lại số cũ hoặc người thân khác.', feedback: 'Đúng. Hình ảnh quen thuộc không thay thế được xác minh độc lập.', delta: 20, ending: 'safe' },
            { text: 'Mẹ tin rồi, gửi tài khoản đi.', reply: 'Mẹ tin rồi. Gửi tài khoản đi.', feedback: 'Một đoạn video ngắn đã làm bác hạ cảnh giác dù các dấu hiệu khác vẫn còn nguyên.', delta: -20, next: 'f3money' },
            { text: 'Cho mẹ số bàn của bệnh viện.', reply: 'Cho mẹ số bàn của bệnh viện.', feedback: 'Không dùng số do đối phương đưa. Hãy tự tìm số bệnh viện trên nguồn chính thức.', delta: 5, next: 'f3doctor' },
          ],
        },
        f3doctor: {
          message: 'Tôi là bác sĩ trực. Gia đình chuyển vào tài khoản cá nhân 0123456789 trong 10 phút để giữ phòng mổ.',
          signals: ['Người thứ hai gây tin tưởng', 'Tài khoản cá nhân', 'Hạn chót giả'],
          choices: [
            { text: 'Tôi sẽ tự gọi tổng đài bệnh viện.', reply: 'Tôi sẽ tự gọi tổng đài bệnh viện để xác minh.', feedback: 'Rất tốt. Bác không để “người thứ hai” trong cùng kịch bản làm bằng chứng.', delta: 20, ending: 'safe' },
            { text: 'Tên bác sĩ và khoa nào? Tôi sẽ kiểm tra.', reply: 'Xin tên bác sĩ và khoa. Tôi sẽ tự kiểm tra.', feedback: 'Bác đang chuyển quyền kiểm soát về phía mình bằng cách xác minh độc lập.', delta: 15, ending: 'safe' },
            { text: 'Tôi chuyển ngay.', reply: 'Tôi chuyển ngay.', feedback: 'Tài khoản cá nhân và hạn chót giả là dấu hiệu rất mạnh nhưng đã bị bỏ qua.', delta: -35, ending: 'danger' },
          ],
        },
        f3money: {
          message: 'Chuyển vào 0123456789, tên Nguyễn Văn T. Mẹ chụp biên lai gửi con ngay và tuyệt đối đừng gọi cho bố!',
          signals: ['Tài khoản cá nhân', 'Đòi biên lai', 'Cô lập khỏi người thân'],
          choices: [
            { text: 'Dừng lại và gọi người nhà xác minh.', reply: 'Mẹ sẽ dừng lại và gọi người nhà.', feedback: 'Bác đã thoát bẫy trước khi tiền rời tài khoản.', delta: 20, ending: 'safe' },
            { text: 'Chuyển thử 500.000đ trước.', reply: 'Mẹ chuyển thử 500.000đ trước.', feedback: 'Chuyển ít vẫn xác nhận bác là mục tiêu có thể khai thác và tiền vẫn có thể mất.', delta: -20, ending: 'danger' },
            { text: 'Chuyển đủ 8 triệu và gửi biên lai.', reply: 'Mẹ chuyển đủ và gửi biên lai.', feedback: 'Kẻ xấu đã đạt mục đích bằng hoảng loạn, bí mật và mạo danh.', delta: -40, ending: 'danger' },
          ],
        },
      },
    },
    bank: {
      title: 'Tài khoản ngân hàng bị khoá',
      category: 'Giả ngân hàng',
      description: 'Một tin nhắn gắn tên ngân hàng cảnh báo giao dịch lạ và gửi đường dẫn xác minh.',
      difficulty: 'Khó',
      duration: '3 phút',
      avatar: 'B',
      sender: 'VCB-HOTRO',
      start: 'b1',
      lessons: [
        'Tự mở ứng dụng ngân hàng hoặc gõ địa chỉ chính thức; không đăng nhập từ liên kết trong tin nhắn.',
        'Ngân hàng không yêu cầu đọc OTP, mật khẩu hoặc cài ứng dụng hỗ trợ từ đường dẫn lạ.',
        'Nếu đã nhập thông tin, khóa dịch vụ và gọi số trên thẻ hoặc trong ứng dụng ngay.',
      ],
      nodes: {
        b1: {
          message: 'VCB: Tài khoản của quý khách có giao dịch 18.900.000đ đang chờ. Xác minh trong 15 phút tại vietcombank-hotro.com để tránh bị khoá.',
          signals: ['Tên miền gần giống', 'Giao dịch gây hoảng', 'Hạn 15 phút'],
          choices: [
            { text: 'Tự mở ứng dụng ngân hàng để kiểm tra.', reply: 'Tôi sẽ tự mở ứng dụng ngân hàng.', feedback: 'Chính xác. Bác không dùng đường dẫn do người gửi kiểm soát.', delta: 25, ending: 'safe' },
            { text: 'Bấm liên kết để xem giao dịch.', reply: 'Tôi bấm liên kết để xem.', feedback: 'Tên miền lạ đã đưa bác sang một trang do kẻ xấu kiểm soát.', delta: -15, next: 'b2' },
            { text: 'Gọi số hỗ trợ ghi trên trang đó.', reply: 'Tôi sẽ gọi số hỗ trợ trên trang.', feedback: 'Số trên trang giả vẫn thuộc kẻ lừa đảo. Cần dùng số trên thẻ hoặc ứng dụng chính thức.', delta: -10, next: 'b2call' },
          ],
        },
        b2: {
          message: 'Trang “xác minh” yêu cầu tên đăng nhập, mật khẩu và mã OTP vừa gửi để huỷ giao dịch.',
          signals: ['Thu thập mật khẩu', 'Yêu cầu OTP'],
          choices: [
            { text: 'Đóng trang và gọi số trên thẻ ngân hàng.', reply: 'Tôi đóng trang và gọi số trên thẻ.', feedback: 'Bác đã dừng đúng lúc. Vì đã mở trang lạ, vẫn nên kiểm tra thiết bị và tài khoản.', delta: 20, ending: 'recover' },
            { text: 'Nhập thông tin để huỷ giao dịch.', reply: 'Tôi nhập thông tin để huỷ giao dịch.', feedback: 'Mật khẩu và OTP có thể cho phép kẻ xấu chiếm tài khoản hoặc duyệt giao dịch.', delta: -35, next: 'b3' },
            { text: 'Nhập thông tin giả để thử trang.', reply: 'Tôi nhập thông tin giả để thử.', feedback: 'Không nên tương tác thêm với trang giả; trang có thể theo dõi thiết bị hoặc dẫn sang bước cài mã độc.', delta: -5, next: 'b3' },
          ],
        },
        b2call: {
          message: '“Nhân viên hỗ trợ” nói đúng tên bác và yêu cầu đọc OTP để khoá giao dịch khẩn cấp.',
          signals: ['Biết thông tin cá nhân', 'Xin đọc OTP'],
          choices: [
            { text: 'Cúp máy, gọi số trên thẻ hoặc trong ứng dụng.', reply: 'Tôi sẽ cúp máy và gọi số chính thức.', feedback: 'Đúng. Biết tên không chứng minh người gọi là ngân hàng.', delta: 25, ending: 'safe' },
            { text: 'Đọc OTP vì họ đã biết tên tôi.', reply: 'Tôi đọc OTP cho nhân viên.', feedback: 'Thông tin cá nhân có thể bị lộ từ nhiều nguồn; OTP vẫn tuyệt đối không được chia sẻ.', delta: -40, ending: 'danger' },
            { text: 'Yêu cầu họ đọc số tài khoản của tôi.', reply: 'Anh đọc số tài khoản của tôi để chứng minh đi.', feedback: 'Kẻ xấu có thể đã có dữ liệu rò rỉ. Cách an toàn vẫn là tự gọi lại kênh chính thức.', delta: 0, next: 'b3' },
          ],
        },
        b3: {
          message: 'Hệ thống báo lỗi. “Nhân viên” gửi tệp VCB-Hotro.apk và yêu cầu cài để chia sẻ màn hình xử lý.',
          signals: ['Tệp APK ngoài kho', 'Đòi chia sẻ màn hình'],
          choices: [
            { text: 'Không cài; ngắt mạng và gọi ngân hàng chính thức.', reply: 'Tôi không cài và sẽ gọi ngân hàng chính thức.', feedback: 'Bác đã dừng bước chiếm quyền thiết bị. Nếu từng nhập mật khẩu, cần đổi ngay trên thiết bị sạch.', delta: 20, ending: 'recover' },
            { text: 'Cài ứng dụng để được hỗ trợ.', reply: 'Tôi cài ứng dụng hỗ trợ.', feedback: 'Ứng dụng ngoài kho có thể chiếm màn hình, tin nhắn OTP và quyền điều khiển máy.', delta: -40, ending: 'danger' },
            { text: 'Chỉ tải về nhưng chưa mở.', reply: 'Tôi chỉ tải tệp về, chưa mở.', feedback: 'Chưa cài đặt giúp giảm rủi ro, nhưng cần xoá tệp và quét thiết bị thay vì tiếp tục.', delta: -10, ending: 'recover' },
          ],
        },
      },
    },
    job: {
      title: 'Việc nhẹ, hoa hồng cao',
      category: 'Nhiệm vụ trực tuyến',
      description: 'Một người tuyển cộng tác viên cho nhận tiền thật lúc đầu rồi yêu cầu nạp vốn.',
      difficulty: 'Khó',
      duration: '3–4 phút',
      avatar: 'T',
      sender: 'Tuyển dụng',
      start: 'j1',
      lessons: [
        'Công việc thật không yêu cầu người lao động nạp tiền để mở nhiệm vụ hoặc rút tiền công.',
        'Khoản lời nhỏ ban đầu thường được dùng để tạo niềm tin trước khi yêu cầu khoản lớn.',
        'Số dư hiển thị trên website không chứng minh tiền thật có thể rút được.',
      ],
      nodes: {
        j1: {
          message: 'Chào chị, bên em tuyển cộng tác viên đánh giá sản phẩm, làm 10 phút được 80.000đ. Không cần kinh nghiệm, nhận tiền ngay.',
          signals: ['Thu nhập dễ dàng', 'Tuyển dụng qua chat'],
          choices: [
            { text: 'Cho tôi tên pháp nhân và hợp đồng để tự kiểm tra.', reply: 'Cho tôi tên pháp nhân và hợp đồng để kiểm tra.', feedback: 'Bác yêu cầu thông tin có thể xác minh thay vì chỉ tin lời giới thiệu.', delta: 15, next: 'j2check' },
            { text: 'Thử một nhiệm vụ miễn phí.', reply: 'Tôi thử một nhiệm vụ miễn phí.', feedback: 'Chưa mất tiền, nhưng khoản thưởng nhỏ có thể là mồi tạo lòng tin.', delta: 0, next: 'j2' },
            { text: 'Tôi không tham gia công việc gửi ngẫu nhiên qua chat.', reply: 'Tôi không tham gia.', feedback: 'Quyết định an toàn nhất khi lời mời không có nguồn tuyển dụng xác thực.', delta: 20, ending: 'safe' },
          ],
        },
        j2check: {
          message: 'Công ty đối tác bảo mật nên không gửi hợp đồng trước. Chị cứ làm thử, em đã hỗ trợ hơn 200 người rồi.',
          signals: ['Né cung cấp pháp nhân', 'Dùng số đông tạo tin tưởng'],
          choices: [
            { text: 'Không có thông tin xác minh thì tôi dừng.', reply: 'Không có thông tin xác minh thì tôi dừng.', feedback: 'Tốt. “Bảo mật” không phải lý do hợp lệ để giấu danh tính đơn vị tuyển dụng.', delta: 20, ending: 'safe' },
            { text: 'Cho tôi xem nhóm những người đã nhận tiền.', reply: 'Cho tôi xem nhóm những người đã nhận tiền.', feedback: 'Nhóm và ảnh chuyển khoản có thể do đồng bọn dựng. Bác vẫn chưa có nguồn độc lập.', delta: -5, next: 'j2' },
            { text: 'Được, tôi làm thử.', reply: 'Được, tôi làm thử.', feedback: 'Bác đã chấp nhận bỏ qua một dấu hiệu né xác minh.', delta: -5, next: 'j2' },
          ],
        },
        j2: {
          message: 'Chúc mừng chị nhận 80.000đ! Nhiệm vụ tiếp theo cần nạp 500.000đ, hoàn thành sẽ nhận lại 650.000đ trong 5 phút.',
          signals: ['Trả mồi ban đầu', 'Yêu cầu nạp tiền'],
          choices: [
            { text: 'Công việc không bắt nhân viên nạp tiền. Tôi dừng.', reply: 'Tôi không nạp tiền để làm việc.', feedback: 'Chính xác. Bác nhận ra thời điểm kịch bản chuyển từ trả tiền sang thu tiền.', delta: 25, ending: 'safe' },
            { text: 'Nạp 500.000đ vì tôi đã nhận được 80.000đ.', reply: 'Tôi nạp 500.000đ.', feedback: 'Khoản trả nhỏ ban đầu đã tạo cảm giác hệ thống đáng tin.', delta: -20, next: 'j3' },
            { text: 'Hỏi có nhiệm vụ nào không cần nạp tiền.', reply: 'Có nhiệm vụ nào không cần nạp tiền không?', feedback: 'Bác chưa chuyển tiền nhưng vẫn để đối phương tiếp tục gây áp lực.', delta: 0, next: 'j2pressure' },
          ],
        },
        j2pressure: {
          message: 'Suất miễn phí hết rồi chị. Gói 500.000đ chỉ còn 3 phút; bỏ qua sẽ mất quyền rút 80.000đ vừa kiếm.',
          signals: ['Đếm ngược giả', 'Dọa mất khoản đã có'],
          choices: [
            { text: 'Tôi chấp nhận bỏ 80.000đ và dừng lại.', reply: 'Tôi dừng lại, không nạp thêm.', feedback: 'Rất tốt. Bác không để một khoản nhỏ kéo mình vào khoản mất lớn hơn.', delta: 20, ending: 'safe' },
            { text: 'Nạp ngay để không mất tiền thưởng.', reply: 'Tôi nạp ngay.', feedback: 'Đây là hiệu ứng sợ mất mát: bác mạo hiểm khoản lớn để giữ một khoản nhỏ.', delta: -25, next: 'j3' },
            { text: 'Xin gia hạn thêm 10 phút.', reply: 'Cho tôi thêm 10 phút.', feedback: 'Thời gian thêm không làm mô hình nạp tiền trở nên hợp pháp; cần dừng hẳn.', delta: -5, next: 'j3' },
          ],
        },
        j3: {
          message: 'Tài khoản hiện có 730.000đ nhưng bị đóng băng. Muốn rút phải nạp thêm 5.000.000đ để nâng cấp VIP và xác minh thuế.',
          signals: ['Số dư ảo', 'Nạp thêm để rút', 'Phí xác minh giả'],
          choices: [
            { text: 'Dừng chuyển tiền, lưu bằng chứng và gọi ngân hàng.', reply: 'Tôi dừng lại, lưu bằng chứng và gọi ngân hàng.', feedback: 'Bác đã cắt chuỗi nạp thêm. Cần báo ngân hàng ngay nếu đã chuyển tiền.', delta: 20, ending: 'recover' },
            { text: 'Nạp 5 triệu để lấy lại cả vốn lẫn lời.', reply: 'Tôi nạp 5 triệu để rút tiền.', feedback: 'Số dư trên màn hình là mồi. Nạp thêm thường chỉ dẫn tới yêu cầu khoản lớn hơn.', delta: -45, ending: 'danger' },
            { text: 'Vay người thân 5 triệu vì chỉ thiếu bước cuối.', reply: 'Tôi sẽ vay 5 triệu để hoàn tất.', feedback: '“Bước cuối” có thể lặp vô hạn; vay thêm làm thiệt hại lan sang người thân.', delta: -45, ending: 'danger' },
          ],
        },
      },
    },
  };

  function clampScore(score) {
    return Math.max(0, Math.min(100, Number(score) || 0));
  }

  function shieldLabel(score) {
    if (score >= 75) return 'Vững vàng';
    if (score >= 50) return 'Đang cảnh giác';
    if (score >= 25) return 'Đang bị dẫn dắt';
    return 'Nguy cơ rất cao';
  }

  function resolveChoice(scenarioId, nodeId, choiceIndex, score) {
    const scenario = scenarios[scenarioId];
    const node = scenario && scenario.nodes[nodeId];
    const choice = node && node.choices[choiceIndex];
    if (!choice) throw new Error('Lựa chọn mô phỏng không hợp lệ.');
    return {
      choice,
      score: clampScore(score + choice.delta),
      next: choice.next || null,
      ending: choice.ending ? endings[choice.ending] : null,
      endingId: choice.ending || null,
    };
  }

  return { scenarios, endings, clampScore, shieldLabel, resolveChoice };
}));
