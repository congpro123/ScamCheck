'use strict';

const RISKS = ['An toàn', 'Nghi ngờ', 'Nguy hiểm'];
const DEFAULT_ACTIONS = ['Không bấm đường dẫn hoặc tải ứng dụng lạ.', 'Tự liên hệ tổ chức qua kênh chính thức.', 'Không cung cấp mật khẩu, OTP hoặc chuyển tiền.'];

function jsonFrom(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value); } catch (_) {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch (_) { return null; }
  }
}

function clean(value, max = 500) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

function parseDetective(raw) {
  const obj = jsonFrom(raw) || {};
  const risk = RISKS.includes(obj.risk) ? obj.risk : 'Nghi ngờ';
  const signals = Array.isArray(obj.signals) ? obj.signals.slice(0, 8).map(x => ({ reason: clean(x?.reason), quote: clean(x?.quote, 180) })).filter(x => x.reason) : [];
  const supplied = Array.isArray(obj.actions) ? obj.actions.map(x => clean(x, 220)).filter(Boolean).slice(0, 3) : [];
  return { risk, signals, actions: [...supplied, ...DEFAULT_ACTIONS].slice(0, 3) };
}

function parsePsychologist(raw) {
  const obj = jsonFrom(raw) || {};
  let explanation = clean(obj.explanation, 800);
  if (!explanation) return { explanation: 'Cô thấy tin này đang tạo áp lực để bác phản ứng thật nhanh. Bác cứ chậm lại và kiểm tra qua kênh chính thức nhé.' };
  const sentences = explanation.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  explanation = sentences.slice(0, 3).join(' ').trim();
  if (sentences.length < 2) explanation += ' Bác cứ bình tĩnh kiểm tra qua kênh chính thức nhé.';
  return { explanation };
}

function fallbackSteps(scenario, hotlines) {
  const police = hotlines.find(x => x.id === 'police')?.phone || '113';
  const scripts = {
    none: [['Dừng tương tác và lưu lại bằng chứng.', 'Tôi sẽ kiểm tra qua kênh chính thức.'], ['Chặn và báo cáo người gửi.', 'Tôi không đồng ý nhận thêm tin nhắn.'], ['Cảnh báo người thân nếu tài khoản có dấu hiệu bị chiếm.', 'Nếu nhận tin từ tôi, hãy gọi lại xác minh.']],
    clicked: [['Ngắt mạng nếu vừa cài tệp hoặc ứng dụng lạ.', 'Tôi cần hỗ trợ kiểm tra thiết bị ngay.'], ['Đổi mật khẩu từ một thiết bị an toàn và bật xác thực hai lớp.', 'Tôi nghi tài khoản bị lộ, vui lòng đăng xuất mọi phiên.'], ['Gọi ngân hàng qua số trên thẻ nếu đã nhập thông tin thanh toán.', 'Xin khoá giao dịch trực tuyến và kiểm tra giao dịch lạ.']],
    shared: [['Đổi ngay mật khẩu đã cung cấp từ thiết bị an toàn.', 'Tôi đã lộ thông tin đăng nhập, xin khoá các phiên đang mở.'], ['Nếu đã lộ OTP, gọi ngân hàng qua số trên thẻ và khoá tài khoản.', 'Xin tạm khoá tài khoản vì tôi vừa lộ mã xác thực.'], ['Theo dõi tài khoản và lưu mọi bằng chứng.', 'Xin ghi nhận sự cố và cung cấp mã tiếp nhận.']],
    paid: [['Gọi ngay ngân hàng qua số trên thẻ để yêu cầu tra soát và phong toả.', 'Tôi vừa chuyển nhầm do bị lừa, xin khẩn cấp tra soát giao dịch.'], [`Trình báo công an gần nhất; trường hợp khẩn cấp gọi ${police}.`, 'Tôi muốn trình báo giao dịch có dấu hiệu lừa đảo.'], ['Giữ biên lai, ảnh chụp, số tài khoản và toàn bộ hội thoại.', 'Đây là toàn bộ bằng chứng và thời điểm giao dịch.']]
  };
  return (scripts[scenario] || scripts.none).map(([action, script]) => ({ action, script }));
}

function parseResponder(raw, scenario, hotlines) {
  const obj = jsonFrom(raw) || {};
  const steps = Array.isArray(obj.steps) ? obj.steps.slice(0, 5).map(x => ({ action: clean(x?.action), script: clean(x?.script) })).filter(x => x.action && x.script) : [];
  return { steps: steps.length >= 3 ? steps : fallbackSteps(scenario, hotlines) };
}

function filterApprovedPhones(result, hotlines) {
  const approved = new Set(hotlines.map(x => x.phone.replace(/\D/g, '')));
  const scrub = value => value.replace(/(?:\+?84|0)?\d[\d .-]{7,12}\d/g, phone => approved.has(phone.replace(/\D/g, '')) ? phone : '[số chưa xác minh đã được ẩn]');
  return { steps: result.steps.map(x => ({ action: scrub(x.action), script: scrub(x.script) })) };
}

module.exports = { parseDetective, parsePsychologist, parseResponder, filterApprovedPhones, jsonFrom };
