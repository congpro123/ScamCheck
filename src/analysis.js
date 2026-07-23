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
  const protectiveWarning = `${refuses}\\s+(?:duoc\\s+)?${protectiveVerb}[^.!?\\n]{0,70}\\b${code}\\b|\\b${code}\\b[^.!?\\n]{0,70}${refuses}\\s+(?:duoc\\s+)?${protectiveVerb}`;
  const warnsNotToShare = new RegExp(protectiveWarning, 'u').test(folded);
  const onlyUseOfficially = new RegExp(`(?:chi\\s+)?nhap\\s+(?:\\b${code}\\b\\s+)?(?:tren|trong)\\s+(?:ung dung|app|trang|website)\\s+chinh thuc|\\b${code}\\b[^.!?\\n]{0,55}chi\\s+nhap\\s+(?:tren|trong)\\s+(?:ung dung|app|trang|website)\\s+chinh thuc`, 'u').test(folded);
  // Xoá riêng mệnh đề phủ định trước khi tìm yêu cầu thật, để “KHÔNG CHIA SẺ MÃ OTP”
  // không bị đọc nhầm thành “CHIA SẺ MÃ OTP”; yêu cầu độc hại ở mệnh đề sau vẫn còn nguyên.
  const withoutProtectiveWarnings = folded.replace(new RegExp(protectiveWarning, 'gu'), ' ');
  const explicitRequest = new RegExp(`(?:doc|chia se|cung cap|dua|bao)\\s+(?:ma\\s+)?(?:otp|xac minh|xac thuc)\\b|gui\\s+(?:ma\\s+)?(?:otp|xac minh|xac thuc)\\s+(?:cho|qua|vao)\\b`, 'u').test(withoutProtectiveWarnings);
  const unsafeInputRequest = !onlyUseOfficially && new RegExp(`nhap\\s+(?:ma\\s+)?(?:otp|xac minh|xac thuc)\\s+(?:tai|vao|tren|cho)\\b`, 'u').test(withoutProtectiveWarnings);
  const asksForOtp = explicitRequest || unsafeInputRequest;
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
  const danger = /https?:\/\/|www\.|\b(?:otp|mat khau|cvv|khancap|khan cap|cap cuu|ngay lap tuc|tai khoan ca nhan|so la|so moi)\b|(?:cai|tai).*(?:apk|ung dung|app|tep)/u.test(folded);
  return knownPeople && knownPurpose && !danger;
}

function hasActionableOtp(text) {
  const folded = foldVietnamese(text);
  const code = '(?:otp|ma\\s+xac\\s+(?:minh|thuc))';
  const request = new RegExp(`(?:gui|doc|chia se|cung cap|dua|bao|nhap)[^.!?\\n]{0,70}\\b${code}\\b|\\b${code}\\b[^.!?\\n]{0,45}(?:gui|doc|chia se|cung cap|dua|bao|nhap)\\s+(?:cho|qua|vao)\\b`, 'u');
  const exposedCode = new RegExp(`\\b${code}\\b[^.!?\\n]{0,35}(?:(?:cua\\s+\\w+\\s+)?(?:la|:)\\s*)\\d{4,8}\\b`, 'u');
  return request.test(folded) || exposedCode.test(folded);
}

function hasActionableMoney(text) {
  const folded = foldVietnamese(text);
  const transfer = '(?:chuyen\\s+(?:khoan|tien)|nop\\s+tien|nap\\s+\\d[\\d .]*(?:nghin|trieu|tr)\\b|gui\\s+\\d[\\d .]*(?:nghin|trieu|tr)\\b)';
  const account = '(?:so\\s+tai\\s+khoan|stk\\b)';
  const deniedRequest = new RegExp(`(?:khong|chua)\\s+(?:he\\s+|tung\\s+)?(?:co\\s+)?(?:yeu cau|de nghi|doi hoi)[^.!?\\n]{0,45}(?:${transfer}|${account})`, 'u').test(folded);
  const descriptiveUse = new RegExp(`${transfer}\\s+(?:chi\\s+)?la\\s+(?:cong viec|hoat dong|dich vu|chuc nang|khai niem)\\b`, 'u').test(folded);
  const directCommand = new RegExp(`(?:^|[.!?\\n,:;]\\s*)(?:(?:hay|vui long|phai|can|mau|nhanh|lam on)\\s+)?${transfer}`, 'u').test(folded);
  const requested = new RegExp(`(?:hay|vui long|phai|can|yeu cau|de nghi|doi hoi|bat buoc|giup)\\b[^.!?\\n]{0,55}(?:${transfer}|${account})`, 'u').test(folded);
  const accountRequest = new RegExp(`(?:gui|cung cap|ke khai|xac nhan|cho\\s+(?:toi|anh|em))[^.!?\\n]{0,45}${account}`, 'u').test(folded);
  const riskyDetails = new RegExp(`${transfer}[^.!?\\n]{0,75}(?:\\b(?:stk|vao tai khoan|tai khoan ca nhan|tai khoan nay|xac minh|mo khoa|phi ho so|nhiem vu|hoa hong|nhan thuong)\\b|trong\\s+\\d+\\s+(?:phut|gio)|\\bngay\\b)`, 'u').test(folded);
  return (!deniedRequest && !descriptiveUse && (directCommand || requested || accountRequest)) || riskyDetails;
}

function hasActionableInstall(text) {
  const folded = foldVietnamese(text);
  const install = '(?:cai|tai)';
  const target = '(?:apk|ung dung|app|tep)';
  const warnsAgainst = new RegExp(`(?:khong|dung|tuyet doi khong)\\s+(?:duoc\\s+)?${install}[^.!?\\n]{0,45}${target}`, 'u').test(folded);
  const directCommand = new RegExp(`(?:^|[.!?\\n,:;]\\s*)(?:(?:hay|vui long|phai|can|mau|roi)\\s+)?${install}[^.!?\\n]{0,55}${target}`, 'u').test(folded);
  const requested = new RegExp(`(?:hay|vui long|phai|can|yeu cau|de nghi|bat buoc|roi)\\s+${install}[^.!?\\n]{0,55}${target}`, 'u').test(folded);
  return !warnsAgainst && (directCommand || requested);
}

function hasActionableSecret(text) {
  const folded = foldVietnamese(text);
  const secret = '(?:mat khau|password|cvv|so the)';
  const request = new RegExp(`(?:gui|doc|chia se|cung cap|dua|bao|nhap|ke khai|cho\\s+(?:toi|nhan vien))[^.!?\\n]{0,70}\\b${secret}\\b`, 'u').test(folded);
  const directChange = new RegExp(`(?:^|[.!?\\n,:;]\\s*)(?:(?:hay|vui long|phai|can)\\s+)?(?:doi|tao)\\s+mat khau\\b`, 'u').test(folded);
  return request || directChange;
}

function isInstallSafetyAdvice(text) {
  const folded = foldVietnamese(text);
  const warnsAgainstInstall = /(?:khong|dung|tuyet doi khong)\s+(?:duoc\s+)?(?:cai|tai)[^.!?\n]{0,55}(?:apk|ung dung|app|tep)/u.test(folded);
  const otherDanger = /https?:\/\/|www\.|\b(?:otp|mat khau|password|cvv|so the|chuyen (?:khoan|tien)|stk|so tai khoan)\b/u.test(folded);
  return warnsAgainstInstall && !otherDanger;
}

function isBenignSensitiveMention(text) {
  const folded = foldVietnamese(text);
  const sensitive = '(?:chuyen\\s+(?:khoan|tien)|nop\\s+tien|otp|ma\\s+xac\\s+(?:minh|thuc)|mat khau|password|cvv|so the|(?:cai|tai)\\s+(?:apk|ung dung|app|tep))';
  const logistics = /\bvan\s+chuyen\s+(?:tien|hang|tai san)\b[^.!?\n]{0,70}\b(?:cong viec|chuc nang|nhiem vu|dich vu|xe)\b|\b(?:cong viec|chuc nang|nhiem vu|dich vu|xe)\b[^.!?\n]{0,70}\bvan\s+chuyen\s+(?:tien|hang|tai san)\b/u.test(folded);
  const evidenceDenial = new RegExp(`(?:chua|khong)\\s+co\\s+(?:bat ky\\s+|du\\s+)?bang\\s+chung[^.!?\\n]{0,180}\\b${sensitive}\\b`, 'u').test(folded);
  const educationalFrame = new RegExp(`\\b(?:bai viet|tin tuc|bao cao|nghien cuu|giai thich|dinh nghia|thao luan)\\b[^.!?\\n]{0,140}\\b${sensitive}\\b`, 'u').test(folded);
  const financialDefinition = /\b(?:chuyen\s+(?:khoan|tien)|van\s+chuyen\s+tien)\b\s+(?:chi\s+)?la\s+(?:cong viec|hoat dong|dich vu|chuc nang|khai niem)\b/u.test(folded);
  const completedPastAction = new RegExp(`\\b(?:toi|anh|em|bo|me|con)\\s+da\\s+${sensitive}\\b`, 'u').test(folded);
  const hasRiskyInstruction = hasActionableOtp(text) || hasActionableMoney(text) || hasActionableInstall(text) || hasActionableSecret(text);
  const externalDanger = /https?:\/\/|www\.|\b(?:khan cap|ngay lap tuc|tai khoan ca nhan|stk)\b/u.test(folded);
  return (logistics || evidenceDenial || educationalFrame || financialDefinition || completedPastAction) && !hasRiskyInstruction && !externalDanger;
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
  // Từ khóa nhạy cảm chỉ thành tín hiệu chắc chắn khi ngữ cảnh thực sự yêu cầu hành động hoặc làm lộ bí mật.
  { id: 'otp', re: /\b(otp|mã xác thực|mã xác minh)\b/iu, when: hasActionableOtp, reason: 'Yêu cầu cung cấp hoặc làm lộ mã xác thực bí mật.', severe: true },
  { id: 'money', re: /(chuyển (khoản|tiền)|nộp tiền|số tài khoản|stk\b|nạp \d+[\d .]*(?:nghìn|triệu|tr)|gửi \d+[\d .]*(?:nghìn|triệu|tr))/iu, when: hasActionableMoney, reason: 'Có yêu cầu thực hiện giao dịch hoặc cung cấp tài khoản.', severe: true },
  { id: 'pressure', re: /(khẩn cấp|ngay lập tức|trong \d+ (phút|giờ)|khoá tài khoản)/iu, reason: 'Tạo áp lực thời gian để người nhận không kịp kiểm chứng.', severe: false },
  { id: 'reward-fee', re: /(?:trúng thưởng|nhận quà)[^.!?\n]{0,80}(?:đóng|nộp|chuyển)[^.!?\n]{0,35}(?:phí|tiền)|(?:đóng|nộp|chuyển)[^.!?\n]{0,35}phí[^.!?\n]{0,35}(?:nhận thưởng|nhận quà)/iu, reason: 'Giải thưởng yêu cầu trả phí trước là dấu hiệu chiếm đoạt.', severe: true },
  { id: 'reward', re: /(trúng thưởng|nhận quà|phí nhận thưởng)/iu, reason: 'Dùng phần thưởng bất ngờ để dụ cung cấp thông tin hoặc trả phí.', severe: false },
  { id: 'authority', re: /(công an|toà án|viện kiểm sát).*(điều tra|bắt giữ|rửa tiền|nộp tiền|chuyển tiền)/iu, reason: 'Mạo danh cơ quan pháp luật và đe doạ.', severe: true },
  { id: 'install', re: /(cài|tải).*(apk|ứng dụng|app|tệp)/iu, when: hasActionableInstall, reason: 'Có yêu cầu cài ứng dụng hoặc tệp có thể gây hại.', severe: true },
  { id: 'secret', re: /(mật khẩu|password|cvv|số thẻ)/iu, when: hasActionableSecret, reason: 'Có yêu cầu cung cấp thông tin đăng nhập hoặc thanh toán nhạy cảm.', severe: true }
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
  // Gom hành vi có rủi ro và URL; không nâng mức chỉ vì một từ khóa đứng riêng lẻ.
  const signals = [];
  const otpSafetyNotice = isOtpSafetyNotice(text);
  const passwordSafetyAdvice = isPasswordSafetyAdvice(text);
  const financialSafetyNotice = isFinancialSafetyNotice(text);
  const installSafetyAdvice = isInstallSafetyAdvice(text);
  const benignTransferContext = isBenignTransferContext(text);
  const benignSensitiveMention = isBenignSensitiveMention(text);
  const securityAdvice = otpSafetyNotice || passwordSafetyAdvice || financialSafetyNotice || installSafetyAdvice;
  const contextualSafety = securityAdvice || benignTransferContext || benignSensitiveMention;
  let severe = false;
  for (const rule of RULES) {
    if (otpSafetyNotice && rule.id === 'otp') continue;
    if (passwordSafetyAdvice && rule.id === 'secret') continue;
    if (installSafetyAdvice && rule.id === 'install') continue;
    if ((financialSafetyNotice || benignTransferContext) && rule.id === 'money') continue;
    const match = text.match(rule.re);
    if (match && (!rule.when || rule.when(text))) { signals.push({ reason: rule.reason, quote: match[0] }); severe ||= rule.severe; }
  }
  for (const rule of SUSPICIOUS_RULES) { const match = text.match(rule.re); if (match) signals.push({ reason: rule.reason, quote: match[0] }); }
  const urls = extractUrls(text).map(inspectDomain).filter(Boolean);
  urls.filter(x => x.suspicious).forEach(x => { signals.push({ reason: x.reason, quote: x.url }); if (!/rút gọn/iu.test(x.reason)) severe = true; });
  if (otpSafetyNotice && signals.length === 0) signals.push({ reason: 'Tin nhắn hướng dẫn bảo vệ mã xác minh và không yêu cầu gửi mã cho người khác.', quote: text.match(/[^.!?\n]*(?:otp|mã xác minh|ma xac minh|mã xác thực|ma xac thuc)[^.!?\n]*/iu)?.[0]?.trim() || 'Mã xác minh' });
  if (passwordSafetyAdvice && signals.length === 0) signals.push({ reason: 'Đây là lời khuyên tăng cường bảo mật, không yêu cầu cung cấp mật khẩu.', quote: text.trim() });
  if (financialSafetyNotice && signals.length === 0) signals.push({ reason: 'Đây là cảnh báo không chuyển tiền vào tài khoản cá nhân, không phải yêu cầu thanh toán.', quote: text.trim() });
  if (installSafetyAdvice && signals.length === 0) signals.push({ reason: 'Đây là cảnh báo không cài tệp hoặc ứng dụng lạ, không phải lời thúc giục cài đặt.', quote: text.trim() });
  if (benignTransferContext && signals.length === 0) signals.push({ reason: 'Nội dung có người quen và mục đích chuyển tiền đã được nêu rõ; vẫn nên xác nhận nếu người gửi dùng số lạ.', quote: text.trim() });
  if (benignSensitiveMention && signals.length === 0) signals.push({ reason: 'Từ khóa nhạy cảm chỉ xuất hiện trong nội dung mô tả, giải thích hoặc phủ định; không có yêu cầu thực hiện hành động rủi ro.', quote: text.trim() });
  return { risk: contextualSafety && !severe ? 'An toàn' : severe ? 'Nguy hiểm' : signals.length ? 'Nghi ngờ' : 'An toàn', signals, urls, otpSafetyNotice, passwordSafetyAdvice, financialSafetyNotice, installSafetyAdvice, benignTransferContext, benignSensitiveMention, contextualSafety, securityAdvice };
}

function mergeAnalysis(ai, local) {
  // AI không bao giờ được phép hạ mức cảnh báo mà lớp luật đã xác định.
  const rank = { 'An toàn': 0, 'Nghi ngờ': 1, 'Nguy hiểm': 2 };
  const base = ai || { risk: 'Nghi ngờ', signals: [], actions: [] };
  const safeOverride = local.contextualSafety && local.risk === 'An toàn';
  const risk = safeOverride ? 'An toàn' : rank[local.risk] > rank[base.risk] ? local.risk : base.risk;
  const signals = (safeOverride ? local.signals : [...local.signals, ...base.signals]).filter((x, i, a) => i === a.findIndex(y => y.reason === x.reason && y.quote === x.quote)).slice(0, 8);
  const defaults = local.otpSafetyNotice
    ? ['Tuyệt đối không cung cấp mã OTP hoặc mã xác minh cho bất kỳ ai.', 'Chỉ nhập mã trong ứng dụng hoặc trang chính thức do bác tự mở.', 'Nếu bác không thực hiện giao dịch này, hãy liên hệ tổ chức qua kênh chính thức.']
    : local.passwordSafetyAdvice
      ? ['Đổi mật khẩu trong ứng dụng hoặc trang chính thức do bác tự mở.', 'Dùng mật khẩu mạnh, riêng biệt và không cung cấp cho bất kỳ ai.', 'Bật xác thực hai lớp để tăng bảo vệ tài khoản.']
      : local.financialSafetyNotice
        ? ['Tiếp tục không chuyển tiền vào tài khoản cá nhân theo yêu cầu từ tin nhắn.', 'Tự mở ứng dụng hoặc gọi số chính thức nếu cần kiểm tra.', 'Không cung cấp OTP, mật khẩu hoặc thông tin thẻ.']
        : local.installSafetyAdvice
          ? ['Tiếp tục không cài tệp hoặc ứng dụng nhận qua tin nhắn.', 'Chỉ tải ứng dụng từ kho chính thức hoặc trang do bác tự mở.', 'Xoá tệp lạ nếu đã tải nhưng chưa cài.']
          : local.benignTransferContext
            ? ['Nội dung hiện có mục đích giao dịch rõ ràng; chỉ cần xác nhận lại nếu người gửi dùng số hoặc tài khoản lạ.', 'Không chia sẻ OTP, mật khẩu hoặc mã xác minh để hoàn tất giao dịch.', 'Kiểm tra lại nếu nội dung sau đó xuất hiện thúc giục hoặc đổi tài khoản nhận.']
            : local.benignSensitiveMention
              ? ['Không cần coi một từ khóa đứng riêng lẻ là dấu hiệu lừa đảo.', 'Chỉ cảnh giác khi có yêu cầu hành động như chuyển tiền, đưa mã bí mật, cài tệp hoặc mở liên kết lạ.', 'Hãy kiểm tra lại nếu nội dung hoặc yêu cầu của người gửi thay đổi.']
    : ['Không bấm đường dẫn hoặc tải ứng dụng lạ.', 'Liên hệ tổ chức qua số chính thức tự tìm.', 'Không cung cấp OTP, mật khẩu hoặc chuyển tiền.'];
  return { risk, signals, actions: safeOverride ? defaults : [...(base.actions || []), ...defaults].filter(Boolean).slice(0, 3) };
}

module.exports = { sanitizeInput, extractUrls, inspectDomain, levenshtein, analyzeWithRules, mergeAnalysis, isOtpSafetyNotice, isPasswordSafetyAdvice, isFinancialSafetyNotice, isInstallSafetyAdvice, isBenignTransferContext, isBenignSensitiveMention, hasActionableOtp, hasActionableMoney, hasActionableInstall, hasActionableSecret };
