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
  const warnsNotToShare = new RegExp(`(?:khong|tuyet doi khong)\\s+(?:duoc\\s+)?(?:chia se|cung cap|dua|gui|tiet lo)[^.!?\\n]{0,45}\\b${code}\\b|\\b${code}\\b[^.!?\\n]{0,45}(?:khong|tuyet doi khong)\\s+(?:duoc\\s+)?(?:chia se|cung cap|dua|gui|tiet lo)`, 'u').test(folded);
  const onlyUseOfficially = new RegExp(`(?:chi\\s+)?nhap\\s+(?:\\b${code}\\b\\s+)?(?:tren|trong)\\s+(?:ung dung|app|trang|website)\\s+chinh thuc|\\b${code}\\b[^.!?\\n]{0,55}chi\\s+nhap\\s+(?:tren|trong)\\s+(?:ung dung|app|trang|website)\\s+chinh thuc`, 'u').test(folded);
  const asksForOtp = new RegExp(`(?:doc|chia se|cung cap|dua|bao)\\s+(?:ma\\s+)?(?:otp|xac minh|xac thuc)\\b|gui\\s+(?:ma\\s+)?(?:otp|xac minh|xac thuc)\\s+(?:cho|qua|vao)\\b`, 'u').test(folded);
  const otherDanger = /https?:\/\/|www\.|\b(?:chuyen (?:khoan|tien)|stk|so tai khoan|mat khau|password|cvv|so the)\b|(?:cai|tai).*(?:apk|ung dung|app)/u.test(folded);
  return new RegExp(`\\b${code}\\b`, 'u').test(folded) && (warnsNotToShare || onlyUseOfficially) && !asksForOtp && !otherDanger;
}

function isPasswordSafetyAdvice(text) {
  const folded = foldVietnamese(text);
  const advice = /(?:doi|thay)\s+mat khau\s+(?:dinh ky|thuong xuyen)|(?:bat|dung|su dung)\s+(?:xac thuc|bao mat)\s+(?:hai|2)\s+(?:lop|yeu to)|xac thuc\s+(?:hai|2)\s+(?:lop|yeu to)/u.test(folded);
  const requestsSecret = /(?:gui|doc|chia se|cung cap|dua|bao|nhap)\s+mat khau\b/u.test(folded);
  const externalAction = /https?:\/\/|www\.|\b(?:chuyen (?:khoan|tien)|stk|so tai khoan|otp|cvv|so the)\b|(?:cai|tai).*(?:apk|ung dung|app)/u.test(folded);
  return advice && !requestsSecret && !externalAction;
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
  { re: /\b(otp|mã xác thực|mã xác minh)\b/iu, reason: 'Yêu cầu hoặc nhắc đến mã xác thực bí mật.' },
  { re: /(chuyển (khoản|tiền)|số tài khoản|stk\b)/iu, reason: 'Yêu cầu giao dịch hoặc cung cấp tài khoản.' },
  { re: /(khẩn cấp|ngay lập tức|trong \d+ (phút|giờ)|khoá tài khoản)/iu, reason: 'Tạo áp lực thời gian để người nhận không kịp kiểm chứng.' },
  { re: /(trúng thưởng|nhận quà|phí nhận thưởng)/iu, reason: 'Dùng phần thưởng bất ngờ để dụ cung cấp thông tin hoặc trả phí.' },
  { re: /(công an|toà án|viện kiểm sát).*(điều tra|bắt giữ|rửa tiền)/iu, reason: 'Mạo danh cơ quan pháp luật và đe doạ.' },
  { re: /(cài|tải).*(apk|ứng dụng|app)/iu, reason: 'Thúc giục cài ứng dụng hoặc tệp có thể gây hại.' },
  { re: /(mật khẩu|password|cvv|số thẻ)/iu, reason: 'Đòi hỏi thông tin đăng nhập hoặc thanh toán nhạy cảm.' }
];

function analyzeWithRules(text) {
  // Gom dấu hiệu từ từ khóa và URL, sau đó nâng mức rủi ro nếu có tín hiệu nghiêm trọng.
  const signals = [];
  const otpSafetyNotice = isOtpSafetyNotice(text);
  const passwordSafetyAdvice = isPasswordSafetyAdvice(text);
  const securityAdvice = otpSafetyNotice || passwordSafetyAdvice;
  for (const rule of RULES) {
    if (otpSafetyNotice && /otp/i.test(rule.re.source)) continue;
    if (passwordSafetyAdvice && /password/i.test(rule.re.source)) continue;
    const match = text.match(rule.re);
    if (match) signals.push({ reason: rule.reason, quote: match[0] });
  }
  const urls = extractUrls(text).map(inspectDomain).filter(Boolean);
  urls.filter(x => x.suspicious).forEach(x => signals.push({ reason: x.reason, quote: x.url }));
  const severe = signals.some(x => /mã xác thực|giao dịch|Mạo danh|cài ứng dụng|nhạy cảm|không chính thức/i.test(x.reason));
  if (otpSafetyNotice && signals.length === 0) signals.push({ reason: 'Tin nhắn hướng dẫn bảo vệ mã xác minh và không yêu cầu gửi mã cho người khác.', quote: text.match(/[^.!?\n]*(?:otp|mã xác minh|ma xac minh|mã xác thực|ma xac thuc)[^.!?\n]*/iu)?.[0]?.trim() || 'Mã xác minh' });
  if (passwordSafetyAdvice && signals.length === 0) signals.push({ reason: 'Đây là lời khuyên tăng cường bảo mật, không yêu cầu cung cấp mật khẩu.', quote: text.trim() });
  return { risk: securityAdvice && !severe ? 'An toàn' : severe ? 'Nguy hiểm' : signals.length ? 'Nghi ngờ' : 'An toàn', signals, urls, otpSafetyNotice, passwordSafetyAdvice, securityAdvice };
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
    : ['Không bấm đường dẫn hoặc tải ứng dụng lạ.', 'Liên hệ tổ chức qua số chính thức tự tìm.', 'Không cung cấp OTP, mật khẩu hoặc chuyển tiền.'];
  return { risk, signals, actions: local.securityAdvice ? defaults : [...(base.actions || []), ...defaults].filter(Boolean).slice(0, 3) };
}

module.exports = { sanitizeInput, extractUrls, inspectDomain, levenshtein, analyzeWithRules, mergeAnalysis, isOtpSafetyNotice, isPasswordSafetyAdvice };
