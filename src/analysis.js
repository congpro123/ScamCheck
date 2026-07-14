'use strict';

const OFFICIAL = ['vietcombank.com.vn', 'bidv.com.vn', 'vietinbank.vn', 'agribank.com.vn', 'mbbank.com.vn', 'techcombank.com', 'vpbank.com.vn', 'acb.com.vn', 'sacombank.com.vn', 'tpb.vn', 'momo.vn', 'zalopay.vn', 'gov.vn'];
const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'shorturl.at', 'is.gd', 'cutt.ly']);

function sanitizeInput(value, max = 6000) {
  if (typeof value !== 'string') return { ok: false, error: 'Vui lòng nhập nội dung tin nhắn.' };
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (!cleaned) return { ok: false, error: 'Tin nhắn đang trống.' };
  if (cleaned.length < 4) return { ok: false, error: 'Tin nhắn quá ngắn để phân tích.' };
  if (cleaned.length > max) return { ok: false, error: `Tin nhắn quá dài (tối đa ${max} ký tự).` };
  return { ok: true, value: cleaned };
}

function extractUrls(text) {
  const regex = /(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|vn|net|org|info|xyz|top|online|site|me|ly)(?:\/[^\s<>"']*)?/giu;
  return [...new Set((text.match(regex) || []).map(x => x.replace(/[),.;!?]+$/, '')))];
}

function levenshtein(a, b) {
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
  { re: /\b(otp|mã xác thực|mã xác minh)\b/iu, reason: 'Yêu cầu hoặc nhắc đến mã xác thực bí mật.' },
  { re: /(chuyển (khoản|tiền)|số tài khoản|stk\b)/iu, reason: 'Yêu cầu giao dịch hoặc cung cấp tài khoản.' },
  { re: /(khẩn cấp|ngay lập tức|trong \d+ (phút|giờ)|khoá tài khoản)/iu, reason: 'Tạo áp lực thời gian để người nhận không kịp kiểm chứng.' },
  { re: /(trúng thưởng|nhận quà|phí nhận thưởng)/iu, reason: 'Dùng phần thưởng bất ngờ để dụ cung cấp thông tin hoặc trả phí.' },
  { re: /(công an|toà án|viện kiểm sát).*(điều tra|bắt giữ|rửa tiền)/iu, reason: 'Mạo danh cơ quan pháp luật và đe doạ.' },
  { re: /(cài|tải).*(apk|ứng dụng|app)/iu, reason: 'Thúc giục cài ứng dụng hoặc tệp có thể gây hại.' },
  { re: /(mật khẩu|password|cvv|số thẻ)/iu, reason: 'Đòi hỏi thông tin đăng nhập hoặc thanh toán nhạy cảm.' }
];

function analyzeWithRules(text) {
  const signals = [];
  for (const rule of RULES) {
    const match = text.match(rule.re);
    if (match) signals.push({ reason: rule.reason, quote: match[0] });
  }
  const urls = extractUrls(text).map(inspectDomain).filter(Boolean);
  urls.filter(x => x.suspicious).forEach(x => signals.push({ reason: x.reason, quote: x.url }));
  const severe = signals.some(x => /mã xác thực|giao dịch|Mạo danh|cài ứng dụng|nhạy cảm|không chính thức/i.test(x.reason));
  return { risk: severe ? 'Nguy hiểm' : signals.length ? 'Nghi ngờ' : 'An toàn', signals, urls };
}

function mergeAnalysis(ai, local) {
  const rank = { 'An toàn': 0, 'Nghi ngờ': 1, 'Nguy hiểm': 2 };
  const base = ai || { risk: 'Nghi ngờ', signals: [], actions: [] };
  const risk = rank[local.risk] > rank[base.risk] ? local.risk : base.risk;
  const signals = [...local.signals, ...base.signals].filter((x, i, a) => i === a.findIndex(y => y.reason === x.reason && y.quote === x.quote)).slice(0, 8);
  const defaults = ['Không bấm đường dẫn hoặc tải ứng dụng lạ.', 'Liên hệ tổ chức qua số chính thức tự tìm.', 'Không cung cấp OTP, mật khẩu hoặc chuyển tiền.'];
  return { risk, signals, actions: [...(base.actions || []), ...defaults].filter(Boolean).slice(0, 3) };
}

module.exports = { sanitizeInput, extractUrls, inspectDomain, levenshtein, analyzeWithRules, mergeAnalysis };
