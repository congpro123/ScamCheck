"use strict";

const RISKS = ["An toàn", "Nghi ngờ", "Nguy hiểm"];
const DEFAULT_ACTIONS = [
  "Không bấm đường dẫn hoặc tải ứng dụng lạ.",
  "Tự liên hệ tổ chức qua kênh chính thức.",
  "Không cung cấp mật khẩu, OTP hoặc chuyển tiền.",
];

function jsonFrom(value) {
  if (value && typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function clean(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseDetective(raw) {
  const obj = jsonFrom(raw) || {};
  const risk = RISKS.includes(obj.risk) ? obj.risk : "Nghi ngờ";
  const signals = Array.isArray(obj.signals)
    ? obj.signals
        .slice(0, 8)
        .map((signal) => ({
          reason: clean(signal?.reason),
          quote: clean(signal?.quote, 180),
        }))
        .filter((signal) => signal.reason)
    : [];
  const supplied = Array.isArray(obj.actions)
    ? obj.actions
        .map((action) => clean(action, 220))
        .filter(Boolean)
        .slice(0, 3)
    : [];
  return {
    risk,
    signals,
    actions: [...supplied, ...DEFAULT_ACTIONS].slice(0, 3),
  };
}

function parsePsychologist(raw) {
  const obj = jsonFrom(raw) || {};
  let explanation = clean(obj.explanation, 800);

  if (!explanation) {
    return {
      explanation:
        "Cô thấy tin này đang tạo áp lực để bác phản ứng thật nhanh. Bác cứ chậm lại và kiểm tra qua kênh chính thức nhé.",
    };
  }

  const sentences = explanation.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  explanation = sentences.slice(0, 3).join(" ").trim();

  if (sentences.length < 2) {
    explanation += " Bác cứ bình tĩnh kiểm tra qua kênh chính thức nhé.";
  }

  return { explanation };
}

function fallbackSteps(scenario, hotlines) {
  const police =
    hotlines.find((contact) => contact.id === "police")?.phone || "113";
  const report =
    hotlines.find((contact) => contact.id === "cyber")?.phone || "156";
  const scripts = {
    none: [
      [
        "Dừng trả lời, không bấm liên kết; chụp màn hình cả số người gửi, nội dung và thời gian.",
        "Tôi sẽ tự kiểm tra thông tin qua ứng dụng hoặc website chính thức.",
      ],
      [
        `Phản ánh số gửi lừa đảo qua tổng đài ${report}; có thể nhắn: LD [số gọi đến] [nội dung] gửi ${report}.`,
        "Tôi muốn phản ánh một cuộc gọi hoặc tin nhắn có dấu hiệu lừa đảo.",
      ],
      [
        "Chặn người gửi sau khi đã lưu bằng chứng và báo cho người thân.",
        "Nếu nhận tin nhắn bất thường mang tên tôi, hãy gọi trực tiếp cho tôi để xác minh.",
      ],
    ],
    clicked: [
      [
        "Đóng trang ngay; nếu đã tải hoặc cài ứng dụng lạ, bật chế độ máy bay và không đăng nhập thêm tài khoản.",
        "Tôi vừa mở liên kết đáng ngờ và cần hỗ trợ kiểm tra thiết bị.",
      ],
      [
        "Dùng một thiết bị an toàn khác để đổi mật khẩu, đăng xuất mọi phiên và bật xác thực hai lớp.",
        "Tôi nghi thông tin đăng nhập đã bị lộ, xin đăng xuất toàn bộ phiên đang mở.",
      ],
      [
        "Nếu đã nhập thông tin thẻ hoặc ngân hàng, gọi số trong ứng dụng chính thức hoặc mặt sau thẻ để khóa giao dịch trực tuyến.",
        "Tôi vừa nhập thông tin vào trang giả mạo. Xin khóa giao dịch trực tuyến và kiểm tra giao dịch lạ.",
      ],
      [
        `Chụp lại đường dẫn và phản ánh qua ${report}; không mở lại liên kết để lấy thêm bằng chứng.`,
        "Tôi muốn phản ánh một liên kết có dấu hiệu lừa đảo.",
      ],
    ],
    shared: [
      [
        "Dùng thiết bị an toàn để đổi mật khẩu bị lộ, đăng xuất mọi phiên và đổi cả nơi đang dùng chung mật khẩu.",
        "Tôi đã lộ thông tin đăng nhập. Xin khóa các phiên đang mở và hỗ trợ bảo vệ tài khoản.",
      ],
      [
        "Nếu đã đưa OTP, số thẻ hoặc CVV, gọi ngay số trong ứng dụng chính thức hoặc mặt sau thẻ để tạm khóa tài khoản/thẻ.",
        "Tôi vừa để lộ mã xác thực hoặc thông tin thẻ. Xin tạm khóa ngay và kiểm tra giao dịch lạ.",
      ],
      [
        "Ghi lại chính xác thông tin đã đưa, thời điểm, số người nhận và chụp toàn bộ hội thoại.",
        "Xin ghi nhận sự cố và cho tôi mã tiếp nhận để theo dõi.",
      ],
      [
        `Phản ánh số liên hệ lừa đảo qua ${report} sau khi đã lưu bằng chứng.`,
        "Tôi muốn phản ánh một số điện thoại có dấu hiệu lừa đảo.",
      ],
    ],
    paid: [
      [
        "Gọi ngay số trong ứng dụng ngân hàng chính thức hoặc mặt sau thẻ; chuẩn bị thời gian, số tiền, mã giao dịch và tài khoản nhận.",
        "Tôi vừa chuyển tiền do bị lừa. Xin khẩn cấp tra soát, đánh dấu giao dịch gian lận và hỗ trợ phong tỏa tài khoản nhận.",
      ],
      [
        "Yêu cầu ngân hàng cấp mã tiếp nhận tra soát; không chuyển thêm tiền cho người hứa lấy lại tiền.",
        "Xin cho tôi mã tiếp nhận, thời hạn xử lý và các giấy tờ cần bổ sung.",
      ],
      [
        `Mang căn cước, biên lai, ảnh chụp hội thoại và thông tin tài khoản nhận đến công an gần nhất; chỉ gọi ${police} khi đang bị đe dọa hoặc cần hỗ trợ khẩn cấp.`,
        "Tôi muốn trình báo giao dịch có dấu hiệu lừa đảo và cung cấp toàn bộ bằng chứng.",
      ],
      [
        `Phản ánh số gọi hoặc nhắn tin lừa đảo qua ${report} sau khi đã liên hệ ngân hàng.`,
        "Tôi muốn phản ánh số liên hệ đã dẫn dụ tôi chuyển tiền.",
      ],
    ],
  };
  return (scripts[scenario] || scripts.none).map(([action, script]) => ({
    action,
    script,
  }));
}

function responseContacts(scenario, text, hotlines) {
  const aliases = {
    vcb: ["vietcombank", "vcb"],
    bidv: ["bidv"],
    ctg: ["vietinbank"],
    agr: ["agribank"],
    mb: ["mb bank", "mbbank"],
    tcb: ["techcombank"],
    vpb: ["vpbank"],
    acb: ["acb"],
    stb: ["sacombank"],
    tpb: ["tpbank"],
  };
  const normalized = String(text || "").toLocaleLowerCase("vi-VN");
  const contacts = [];
  const bankId = Object.keys(aliases).find((id) =>
    aliases[id].some((alias) => normalized.includes(alias)),
  );
  const bank = hotlines.find((contact) => contact.id === bankId);

  if (bank && ["clicked", "shared", "paid"].includes(scenario)) {
    contacts.push({
      ...bank,
      purpose: "Khóa tài khoản/thẻ, kiểm tra giao dịch lạ và yêu cầu tra soát.",
    });
  }

  const report = hotlines.find((contact) => contact.id === "cyber");

  if (report) {
    contacts.push({
      ...report,
      purpose:
        "Gọi hoặc nhắn tin để phản ánh số điện thoại có dấu hiệu lừa đảo.",
    });
  }

  const nationalCyber = hotlines.find(
    (contact) => contact.id === "national-cyber",
  );

  if (nationalCyber && ["clicked", "shared", "paid"].includes(scenario)) {
    contacts.push({
      ...nationalCyber,
      purpose:
        "Nhận hỗ trợ khi thiết bị, tài khoản hoặc dữ liệu có nguy cơ mất an toàn mạng.",
    });
  }

  const cyberPolice = hotlines.find((contact) => contact.id === "cyber-police");

  if (cyberPolice && ["shared", "paid"].includes(scenario)) {
    contacts.push({
      ...cyberPolice,
      purpose:
        "Liên hệ khi đã lộ thông tin quan trọng, bị chiếm đoạt tài sản hoặc cần trình báo tội phạm công nghệ cao.",
    });
  }

  const police = hotlines.find((contact) => contact.id === "police");

  if (police && scenario === "paid") {
    contacts.push({
      ...police,
      purpose:
        "Chỉ gọi khi đang bị đe dọa hoặc cần hỗ trợ khẩn cấp; trường hợp thường hãy đến công an gần nhất.",
    });
  }

  return contacts;
}

function parseResponder(raw, scenario, hotlines) {
  const obj = jsonFrom(raw) || {};
  const steps = Array.isArray(obj.steps)
    ? obj.steps
        .slice(0, 5)
        .map((step) => ({
          action: clean(step?.action),
          script: clean(step?.script),
        }))
        .filter((step) => step.action && step.script)
    : [];
  const required = {
    none: /(dừng|chặn|lưu.*bằng chứng)/iu,
    clicked: /(ngắt.*mạng|thiết bị|đổi.*mật khẩu|gỡ.*ứng dụng)/iu,
    shared: /(đổi.*mật khẩu|lộ.*otp|lộ.*mã|khóa|khoá.*tài khoản)/iu,
    paid: /(ngân hàng|tra soát|phong tỏa|phong toả|trình báo)/iu,
  };
  const combined = steps
    .map((step) => `${step.action} ${step.script}`)
    .join(" ");
  const matchesScenario = required[scenario]?.test(combined);
  return {
    steps:
      steps.length >= 3 && matchesScenario
        ? steps
        : fallbackSteps(scenario, hotlines),
  };
}

function filterApprovedPhones(result, hotlines) {
  const approvedPhoneNumbers = new Set(
    hotlines.map((contact) => contact.phone.replace(/\D/g, "")),
  );
  const hideUnknownPhones = (value) =>
    value.replace(/(?:\+?84|0)?\d[\d .-]{7,12}\d/g, (phone) =>
      approvedPhoneNumbers.has(phone.replace(/\D/g, ""))
        ? phone
        : "[số chưa xác minh đã được ẩn]",
    );

  return {
    steps: result.steps.map((step) => ({
      action: hideUnknownPhones(step.action),
      script: hideUnknownPhones(step.script),
    })),
  };
}

module.exports = {
  parseDetective,
  parsePsychologist,
  parseResponder,
  filterApprovedPhones,
  responseContacts,
  jsonFrom,
};
