'use strict';

const OFFICIAL = ['vietcombank.com.vn', 'bidv.com.vn', 'vietinbank.vn', 'agribank.com.vn', 'mbbank.com.vn', 'techcombank.com', 'vpbank.com.vn', 'acb.com.vn', 'sacombank.com.vn', 'tpb.vn', 'momo.vn', 'zalopay.vn', 'gov.vn'];
// Danh sách dịch vụ rút gọn cần cảnh báo vì người dùng không nhìn thấy đích thật.
const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'shorturl.at', 'is.gd', 'cutt.ly']);

function foldVietnamese(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/giu, 'd').toLowerCase();
}

function isOtpSafetyNotice(text) {
  const folded = foldVietnamese(text);
  const code = '(?:otp|ma\\s+xac\\s+(?:minh|thuc))';
  const refuses = '(?:khong|tuyet doi khong|dung)';
  const protectiveVerb = '(?:chia se|cung cap|dua|gui|doc|tiet lo)';
  const warnsNotToShare = new RegExp(`${refuses}\\s+(?:duoc\\s+)?${protectiveVerb}[^.!?\\n]{0,70}\\b${code}\\b|\\b${code}\\b[^.!?\\n]{0,70}${refuses}\\s+(?:duoc\\s+)?${protectiveVerb}`, 'u').test(folded);
  const onlyUseOfficially = new RegExp(`(?:chi\\s+)?nhap\\s+(?:\\b${code}\\b\\s+)?(?:tren|trong)\\s+(?:ung dung|app|trang|website)\\s+chinh thuc|\\b${code}\\b[^.!?\\n]{0,55}chi\\s+nhap\\s+(?:tren|trong)\\s+(?:ung dung|app|trang|website)\\s+chinh thuc`, 'u').test(folded);
  const asksForOtp = new RegExp(`(?:doc|chia se|cung cap|dua|bao)\\s+(?:ma\\s+)?(?:otp|xac minh|xac thuc)\\b|gui\\s+(?:ma\\s+)?(?:otp|xac minh|xac thuc)\\s+(?:cho|qua|vao)\\b`, 'u').test(folded);
  const otherDanger = /https?:\/\/|www\.|\b(?:chuyen (?:khoan|tien)|stk|so tai khoan|mat khau|password|cvv|so the)\b|(?:cai|tai).*(?:apk|ung dung|app)/u.test(folded);
  return new RegExp(`\\b${code}\\b`, 'u').test(folded) && (warnsNotToShare || onlyUseOfficially) && !asksForOtp && !otherDanger;
}

function isPasswordSafetyAdvice(text) {
  const folded = foldVietnamese(text);
  const safeSecretWarning = /(?:khong|tuyet doi khong|dung)\s+(?:duoc\s+)?(?:chia se|cung cap|gui|doc|tiet lo)[^.!?\n]{0,55}(?:mat khau|password|cvv|so the)/u.test(folded);
  const advice = /(?:doi|thay)\s+mat khau\s+(?:dinh ky|thuong xuyen)|(?:bat|dung|su dung)\s+(?:xac thuc|bao mat)\s+(?:hai|2)\s+(?:lop|yeu to)|xac thuc\s+(?:hai|2)\s+(?:lop|yeu to)/u.test(folded) || safeSecretWarning;
  const requestsSecret = /(?:gui|doc|chia se|cung cap|dua|bao|nhap)\s+(?:mat khau|password|cvv|so the)\b/u.test(folded) && !safeSecretWarning;
  const externalAction = /https?:\/\/|www\.|\b(?:chuyen (?:khoan|tien)|stk|so tai khoan|otp)\b|(?:cai|tai).*(?:apk|ung dung|app|tep)/u.test(folded);
  return advice && !requestsSecret && !externalAction;
}

function isFinancialSafetyNotice(text) {
  const folded = foldVietnamese(text);
  const warnsAgainstPayment = /(?:khong|khong bao gio|tuyet doi khong)\s+(?:duoc\s+)?(?:yeu cau[^.!?\n]{0,35})?(?:chuyen khoan|chuyen tien|nop tien)[^.!?\n]{0,55}(?:tai khoan ca nhan|nguoi la)|(?:khong|tuyet doi khong)\s+(?:chuyen khoan|chuyen tien|nop tien)\b/u.test(folded);
  const externalAction = /https?:\/\/|www\.|\b(?:otp|mat khau|password|cvv|so the)\b|(?:cai|tai).*(?:apk|ung dung|app|tep)/u.test(folded);
  return warnsAgainstPayment && !externalAction;
}

function isBenignTransferContext(text) {
  const folded = foldVietnamese(text);
  const knownPeople = /\b(?:bo|me|con|anh|em|vo|chong|ong|ba)\b/u.test(folded);
  const knownPurpose = /(?:nhu da thong nhat|an trua|mung sinh nhat|tien hoc|tien dien|tien nha)/u.test(folded);
  const danger = /https?:\/\/|www\.|\b(?:otp|mat khau|cvv|khancap|khan cap|cap cuu|ngay lap tuc)\b|(?:cai|tai).*(?:apk|ung dung|app|tep)/u.test(folded);
  return knownPeople && knownPurpose && !danger;
}

function sanitizeInput(value, max = 6000) {
  // Loại ký tự điều khiển, chặn chuỗi rỗng/quá ngắn/quá dài trước khi gọi AI.
  if (typeof value !== 'string') return { ok: false, error: 'Vui lòng nhập nội dung tin nhắn.' };
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (!cleaned) return { ok: false, error: 'Tin nhắn đang trống.' };
  if (cleaned.length < 4) return { ok: false, error: 'Tin nhắn quá ngắn để phân tích.' };
  if (cleaned.length > max) return { ok: false, error: `Tin nhắn quá dài (tối đa ${max} ký tự).` };
  return { ok: true, value: cleaned };
}

function extractUrls(text) {
  // Bắt cả URL có giao thức, www và tên miền viết trực tiếp trong tin nhắn.
  const regex = /(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|vn|net|org|info|xyz|top|online|site|me|ly)(?:\/[^\s<>"']*)?/giu;
  return [...new Set((text.match(regex) || []).map(x => x.replace(/[),.;!?]+$/, '')))];
}

function levenshtein(a, b) {
  // Khoảng cách chỉnh sửa giúp phát hiện tên miền chỉ sai 1-2 ký tự so với tên chính thức.
  const row = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = old;
    }
  }
  return row[b.length];
}

function inspectDomain(url) {
  let host;
  try { host = new URL(/^https?:/i.test(url) ? url : `https://${url.replace(/^www\./i, '')}`).hostname.toLowerCase().replace(/^www\./, ''); } catch (_) { return null; }
  // Chuẩn hóa các ký tự đồng hình phổ biến: 0→o, 1→l và rn→m.
  const normalized = host.normalize('NFKD').replace(/[^a-z0-9.-]/g, '').replace(/0/g, 'o').replace(/1/g, 'l').replace(/rn/g, 'm');
  if (SHORTENERS.has(host)) return { url, host, suspicious: true, reason: 'Đường dẫn rút gọn che giấu địa chỉ đích; hãy mở bằng công cụ kiểm tra an toàn.' };
  if (host.includes('xn--')) return { url, host, suspicious: true, reason: 'Tên miền quốc tế hoá có thể dùng ký tự đồng hình để giả mạo.' };
  const lookalike = OFFICIAL.map(domain => ({ domain, distance: levenshtein(normalized, domain) })).sort((a, b) => a.distance - b.distance)[0];
  const official = OFFICIAL.some(domain => host === domain || host.endsWith(`.${domain}`));
  const normalizedLabel = normalized.split('.')[0];
  const imitatedBrand = ['vietcombank','bidv','vietinbank','agribank','mbbank','techcombank','vpbank'].some(brand => levenshtein(normalizedLabel.replace(/-/g, ''), brand) <= 2);
  if (!official && imitatedBrand) return { url, host, suspicious: true, reason: 'Tên miền bắt chước tên ngân hàng nhưng dùng phần mở rộng hoặc cách viết không chính thức.' };
  if (!official && lookalike.distance <= 2) return { url, host, suspicious: true, reason: `Tên miền gần giống ${lookalike.domain} nhưng không phải tên miền chính thức.` };
  if (!official && /(vietcombank|bidv|vietinbank|agribank|mbbank|techcombank|vpbank|congan|chinhphu)/i.test(host)) return { url, host, suspicious: true, reason: 'Tên tổ chức xuất hiện trong một tên miền không chính thức.' };
  return { url, host, suspicious: false, reason: '' };
}

const RULES = [
  // Lớp luật bắt tín hiệu chắc chắn, độc lập với phán đoán xác suất của AI.
  { id: 'otp', re: /\b(otp|mã xác thực|mã xác minh)\b/iu, reason: 'Yêu cầu hoặc nhắc đến mã xác thực bí mật.', severe: true },
  { id: 'money', re: /(chuyển (khoản|tiền)|nộp tiền|số tài khoản|stk\b|nạp \d+[\d .]*(?:nghìn|triệu|tr)|gửi \d+[\d .]*(?:nghìn|triệu|tr)[^.!?\n]{0,45}(?:tài khoản|stk))/iu, reason: 'Yêu cầu giao dịch hoặc cung cấp tài khoản.', severe: true },
  { id: 'pressure', re: /(khẩn cấp|ngay lập tức|trong \d+ (phút|giờ)|khoá tài khoản)/iu, reason: 'Tạo áp lực thời gian để người nhận không kịp kiểm chứng.', severe: false },
  { id: 'reward-fee', re: /(?:trúng thưởng|nhận quà)[^.!?\n]{0,80}(?:đóng|nộp|chuyển)[^.!?\n]{0,35}(?:phí|tiền)|(?:đóng|nộp|chuyển)[^.!?\n]{0,35}phí[^.!?\n]{0,35}(?:nhận thưởng|nhận quà)/iu, reason: 'Giải thưởng yêu cầu trả phí trước là dấu hiệu chiếm đoạt.', severe: true },
  { id: 'reward', re: /(trúng thưởng|nhận quà|phí nhận thưởng)/iu, reason: 'Dùng phần thưởng bất ngờ để dụ cung cấp thông tin hoặc trả phí.', severe: false },
  { id: 'authority', re: /(công an|toà án|viện kiểm sát).*(điều tra|bắt giữ|rửa tiền|nộp tiền|chuyển tiền)/iu, reason: 'Mạo danh cơ quan pháp luật và đe doạ.', severe: true },
  { id: 'install', re: /(cài|tải).*(apk|ứng dụng|app|tệp)/iu, reason: 'Thúc giục cài ứng dụng hoặc tệp có thể gây hại.', severe: true },
  { id: 'secret', re: /(mật khẩu|password|cvv|số thẻ)/iu, reason: 'Đòi hỏi thông tin đăng nhập hoặc thanh toán nhạy cảm.', severe: true }
];

const SUSPICIOUS_RULES = [
  { re: /(?:bưu phẩm|đơn hàng).*(?:thiếu|xác nhận).*(?:địa chỉ)|(?:địa chỉ).*(?:đang thiếu|cần xác nhận)/iu, reason: 'Đề nghị bổ sung địa chỉ cho bưu phẩm hoặc đơn hàng chưa được xác minh.' },
  { re: /(?:món quà|quà)\s+bất ngờ|(?:được chọn|đang chờ)\s+nhận quà|giải quay số.*(?:kết quả|trúng)/iu, reason: 'Thông báo quà hoặc giải thưởng không nêu nguồn có thể là mồi nhử.' },
  { re: /tài khoản.*(?:hoạt động|giao dịch)\s+lạ/iu, reason: 'Cảnh báo hoạt động tài khoản mơ hồ cần được kiểm tra qua ứng dụng chính thức.' },
  { re: /(?:đầu tư.*lợi nhuận cao|việc làm.*(?:thu nhập|lương).*(?:triệu|mỗi ngày))/iu, reason: 'Lời hứa thu nhập hoặc lợi nhuận cao bất thường cần được xác minh.' },
  { re: /(?:shipper|giao hàng).*(?:kết bạn|zalo)/iu, reason: 'Người gửi muốn chuyển trao đổi giao hàng sang tài khoản cá nhân.' },
  { re: /(?:dùng|lấy|đăng).*(?:ảnh|hình ảnh).*(?:xác minh|danh tính)/iu, reason: 'Thông báo mơ hồ về hình ảnh hoặc danh tính có thể nhằm gây lo lắng.' },
  { re: /(?:người thân.*(?:ở viện|cấp cứu)|thông tin quan trọng.*gia đình)/iu, reason: 'Nội dung về người thân tạo lo lắng nhưng thiếu thông tin kiểm chứng.' },
  { re: /(?:điện thoại.*(?:hỏng|mất).*(?:mượn máy|số mới)|mượn máy.*nhắn)/iu, reason: 'Người gửi tự nhận dùng thiết bị hoặc số lạ, có nguy cơ mạo danh.' },
  { re: /(?:bảo hiểm.*(?:cập nhật|hồ sơ).*thiếu|hỗ trợ người cao tuổi.*(?:sắp hết hạn|đăng ký))/iu, reason: 'Chương trình hoặc hồ sơ chưa nêu rõ cơ quan và kênh xác minh.' },
  { re: /đơn hàng\s+miễn phí.*xác nhận\s+địa chỉ/iu, reason: 'Đơn hàng miễn phí yêu cầu xác nhận địa chỉ cần được đối chiếu.' }
];

function analyzeWithRules(text) {
  // Gom dấu hiệu từ từ khóa và URL, sau đó nâng mức rủi ro nếu có tín hiệu nghiêm trọng.
  const signals = [];
  const otpSafetyNotice = isOtpSafetyNotice(text);
  const passwordSafetyAdvice = isPasswordSafetyAdvice(text);
  const financialSafetyNotice = isFinancialSafetyNotice(text);
  const benignTransferContext = isBenignTransferContext(text);
  const securityAdvice = otpSafetyNotice || passwordSafetyAdvice || financialSafetyNotice;
  let severe = false;
  for (const rule of RULES) {
    if (otpSafetyNotice && rule.id === 'otp') continue;
    if (passwordSafetyAdvice && rule.id === 'secret') continue;
    if ((financialSafetyNotice || benignTransferContext) && rule.id === 'money') continue;
    const match = text.match(rule.re);
    if (match) { signals.push({ reason: rule.reason, quote: match[0] }); severe ||= rule.severe; }
  }
  for (const rule of SUSPICIOUS_RULES) { const match = text.match(rule.re); if (match) signals.push({ reason: rule.reason, quote: match[0] }); }
  const urls = extractUrls(text).map(inspectDomain).filter(Boolean);
  urls.filter(x => x.suspicious).forEach(x => { signals.push({ reason: x.reason, quote: x.url }); if (!/rút gọn/iu.test(x.reason)) severe = true; });
  if (otpSafetyNotice && signals.length === 0) signals.push({ reason: 'Tin nhắn hướng dẫn bảo vệ mã xác minh và không yêu cầu gửi mã cho người khác.', quote: text.match(/[^.!?\n]*(?:otp|mã xác minh|ma xac minh|mã xác thực|ma xac thuc)[^.!?\n]*/iu)?.[0]?.trim() || 'Mã xác minh' });
  if (passwordSafetyAdvice && signals.length === 0) signals.push({ reason: 'Đây là lời khuyên tăng cường bảo mật, không yêu cầu cung cấp mật khẩu.', quote: text.trim() });
  if (financialSafetyNotice && signals.length === 0) signals.push({ reason: 'Đây là cảnh báo không chuyển tiền vào tài khoản cá nhân, không phải yêu cầu thanh toán.', quote: text.trim() });
  if (benignTransferContext && signals.length === 0) signals.push({ reason: 'Nội dung có người quen và mục đích chuyển tiền đã được nêu rõ; vẫn nên xác nhận nếu người gửi dùng số lạ.', quote: text.trim() });
  return { risk: (securityAdvice || benignTransferContext) && !severe ? 'An toàn' : severe ? 'Nguy hiểm' : signals.length ? 'Nghi ngờ' : 'An toàn', signals, urls, otpSafetyNotice, passwordSafetyAdvice, financialSafetyNotice, benignTransferContext, securityAdvice };
}

function mergeAnalysis(ai, local) {
  // AI không bao giờ được phép hạ mức cảnh báo mà lớp luật đã xác định.
  const rank = { 'An toàn': 0, 'Nghi ngờ': 1, 'Nguy hiểm': 2 };
  const base = ai || { risk: 'Nghi ngờ', signals: [], actions: [] };
  const risk = local.securityAdvice ? 'An toàn' : rank[local.risk] > rank[base.risk] ? local.risk : base.risk;
  const signals = (local.securityAdvice ? local.signals : [...local.signals, ...base.signals]).filter((x, i, a) => i === a.findIndex(y => y.reason === x.reason && y.quote === x.quote)).slice(0, 8);
  const defaults = local.otpSafetyNotice
    ? ['Tuyệt đối không cung cấp mã OTP hoặc mã xác minh cho bất kỳ ai.', 'Chỉ nhập mã trong ứng dụng hoặc trang chính thức do bác tự mở.', 'Nếu bác không thực hiện giao dịch này, hãy liên hệ tổ chức qua kênh chính thức.']
    : local.passwordSafetyAdvice
      ? ['Đổi mật khẩu trong ứng dụng hoặc trang chính thức do bác tự mở.', 'Dùng mật khẩu mạnh, riêng biệt và không cung cấp cho bất kỳ ai.', 'Bật xác thực hai lớp để tăng bảo vệ tài khoản.']
      : local.financialSafetyNotice
        ? ['Tiếp tục không chuyển tiền vào tài khoản cá nhân theo yêu cầu từ tin nhắn.', 'Tự mở ứng dụng hoặc gọi số chính thức nếu cần kiểm tra.', 'Không cung cấp OTP, mật khẩu hoặc thông tin thẻ.']
    : ['Không bấm đường dẫn hoặc tải ứng dụng lạ.', 'Liên hệ tổ chức qua số chính thức tự tìm.', 'Không cung cấp OTP, mật khẩu hoặc chuyển tiền.'];
  return { risk, signals, actions: local.securityAdvice ? defaults : [...(base.actions || []), ...defaults].filter(Boolean).slice(0, 3) };
}

module.exports = { sanitizeInput, extractUrls, inspectDomain, levenshtein, analyzeWithRules, mergeAnalysis, isOtpSafetyNotice, isPasswordSafetyAdvice, isFinancialSafetyNotice, isBenignTransferContext };
