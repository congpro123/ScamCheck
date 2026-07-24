'use strict';
// Tiện ích truy vấn DOM ngắn gọn, chỉ dùng với selector nội bộ do ứng dụng kiểm soát.
const $ = s => document.querySelector(s); const $$ = s => [...document.querySelectorAll(s)];
// Mọi dữ liệu phiên được lưu cục bộ; LIMIT là trần gọi AI hiển thị cho người dùng.
const KEYS={history:'scamcheck_history',cache:'scamcheck_cache_context_v3',logs:'scamcheck_logs',prefs:'scamcheck_prefs',training:'scamcheck_training_v1'}; const LIMIT=6;
// Ba tin mẫu giúp người dùng thử nhanh mà không phải tự nhập.
const samples={prize:'CHÚC MỪNG! Bạn trúng iPhone 16. Chuyển 499.000đ phí nhận thưởng vào STK 0123456789 trong 30 phút.',bank:'Vietcombank: Tài khoản sắp bị khoá. Xác minh ngay tại https://vietcombank-xacminh.com và nhập OTP.',safe:'Mẹ ơi, chiều nay con về lúc 6 giờ. Mẹ có cần con mua thêm rau không?'};
// Dữ liệu thư viện được giữ phía client để lọc/chuyển trang không cần tải lại.
const scams=[
 {g:'Giả ngân hàng',t:'Khoá tài khoản giả',d:'Dọa tài khoản bị khoá để dụ bấm liên kết.',sign:'Tên miền gần giống ngân hàng; đòi OTP; thúc giục.'},{g:'Giả ngân hàng',t:'Hoàn tiền thẻ',d:'Hứa hoàn tiền rồi xin số thẻ và CVV.',sign:'Ngân hàng không hỏi OTP/CVV qua tin nhắn.'},{g:'Giả ngân hàng',t:'Nâng hạn mức',d:'Mời nâng hạn mức qua ứng dụng lạ.',sign:'Tệp APK ngoài kho ứng dụng chính thức.'},
 {g:'Giả công an',t:'Liên quan vụ án',d:'Dọa có lệnh bắt vì liên quan rửa tiền.',sign:'Yêu cầu chuyển tiền “chứng minh trong sạch”.'},{g:'Giả công an',t:'Phạt nguội',d:'Gửi liên kết đóng phạt giao thông giả.',sign:'Đe dọa, tên miền không thuộc .gov.vn.'},{g:'Giả công an',t:'Cài định danh điện tử',d:'Hướng dẫn cài ứng dụng định danh giả.',sign:'Cơ quan nhà nước không gửi APK qua chat.'},
 {g:'Trúng thưởng',t:'Quà từ nhãn hàng',d:'Báo trúng quà dù chưa tham gia.',sign:'Phải trả phí trước khi nhận quà.'},{g:'Trúng thưởng',t:'Giải quay số',d:'Giả kết quả quay số may mắn.',sign:'Đòi thông tin ngân hàng để “nhận giải”.'},{g:'Trúng thưởng',t:'Việc nhẹ hoa hồng',d:'Cho lời nhỏ rồi dụ nạp tiền lớn.',sign:'Nạp trước để mở nhiệm vụ hoặc rút tiền.'},
 {g:'Giả giao hàng',t:'Thiếu phí vận chuyển',d:'Đòi chuyển khoản khoản phí rất nhỏ.',sign:'Tài khoản cá nhân lạ, liên kết thanh toán.'},{g:'Giả giao hàng',t:'Giao nhầm đơn',d:'Xin mã OTP với lý do huỷ đơn.',sign:'Shipper không cần OTP ngân hàng.'},{g:'Giả giao hàng',t:'Đăng ký hội viên',d:'Dụ đăng ký gói giao hàng định kỳ.',sign:'Ép chia sẻ màn hình hoặc cài ứng dụng.'}
];
// Bộ 10 câu luyện tập cố định để điểm số và lời giải luôn nhất quán.
const quizData=[
 ['Ngân hàng: OTP 482911 của quý khách, tuyệt đối không cung cấp cho bất kỳ ai.','safe','Đây là cảnh báo bảo mật, không yêu cầu gửi OTP.'],['Công an yêu cầu bác chuyển 20 triệu vào tài khoản an toàn để xác minh.','scam','Cơ quan công an không yêu cầu chuyển tiền để điều tra.'],['Bưu tá gọi báo đơn hàng 120.000đ bác đã đặt và cho phép kiểm tra hàng trước.','safe','Không có yêu cầu bất thường; vẫn nên đối chiếu đơn đã đặt.'],['Tài khoản sắp khoá, đăng nhập vietcornbank.com ngay.','scam','Tên miền dùng “rn” giả chữ “m” và tạo áp lực.'],['Con đổi số mới, mẹ chuyển tiền học phí ngay giúp con.','scam','Mạo danh người thân và thúc chuyển tiền; cần gọi số cũ xác minh.'],['Lịch khám của bác lúc 9:00 ngày mai tại phòng khám quen.','safe','Đây là thông báo lịch hẹn, không đòi dữ liệu hay tiền.'],['Chúc mừng trúng xe máy, đóng 2 triệu phí hồ sơ để nhận.','scam','Giải thưởng bất ngờ kèm phí trả trước là dấu hiệu điển hình.'],['Mã giao dịch của quý khách thành công. Nếu không phải bạn, gọi số sau thẻ.','safe','Khuyến nghị dùng số chính thức trên thẻ, không đưa liên kết lạ.'],['Cài file VNeID.apk này để cán bộ hỗ trợ đồng bộ.','scam','Không cài APK được gửi qua chat; có nguy cơ chiếm thiết bị.'],['Bạn Lan gửi ảnh họp lớp và hỏi bác có tham dự không.','safe','Trao đổi cá nhân bình thường, không có yêu cầu nhạy cảm.']
];
// Thông tin ngữ cảnh biến mỗi câu hỏi thành một bài quan sát ngắn, gần với tình huống thật.
const quizMeta=[
 {sender:'Ngân hàng của bác',detail:'Brandname NGANHANG',channel:'Tin nhắn SMS',time:'Hôm nay · 08:42',focus:'Giữ kín mã OTP',hint:'Tin này chỉ nhắc bác giữ kín, hay đang xin bác gửi mã OTP?',lessonTitle:'OTP chỉ để bác tự dùng',clues:['Chỉ nhắc không chia sẻ OTP','Không có đường dẫn hoặc yêu cầu trả lời','Người gửi không hỏi thông tin bí mật'],safeAction:'Không gửi OTP cho bất kỳ ai. Nếu bác không thực hiện giao dịch, hãy tự mở ứng dụng ngân hàng để kiểm tra.'},
 {sender:'Người tự xưng công an',detail:'Số lạ · 09•• ••• 318',channel:'Cuộc gọi đã chép lại',time:'Hôm nay · 09:15',focus:'Yêu cầu chuyển tiền',hint:'Công an có yêu cầu bác chuyển tiền để chứng minh trong sạch không?',lessonTitle:'Không có “tài khoản an toàn” để điều tra',clues:['Tự xưng công an qua số lạ','Yêu cầu chuyển ngay 20 triệu đồng','Dùng cụm từ “tài khoản an toàn”'],safeAction:'Cúp máy, không chuyển tiền và tự gọi cơ quan công an qua số chính thức nếu cần xác minh.'},
 {sender:'Bưu tá giao hàng',detail:'Đơn dự kiến · 120.000đ',channel:'Cuộc gọi giao hàng',time:'Hôm nay · 10:06',focus:'Kiểm tra đơn đã đặt',hint:'Bác có đặt đúng món và đúng số tiền 120.000đ này không?',lessonTitle:'Đơn hàng thật vẫn cần đối chiếu',clues:['Cho phép kiểm tra hàng trước','Không xin OTP hoặc mật khẩu','Số tiền cần khớp với đơn đã đặt'],safeAction:'Đối chiếu tên món, số tiền và người bán trước khi nhận. Không cung cấp OTP cho bưu tá.'},
 {sender:'VCB-HOTRO',detail:'Tin nhắn từ số lạ',channel:'Tin nhắn kèm tên miền',time:'Hôm nay · 11:24',focus:'Tên miền giả',hint:'Nhìn kỹ “vietcornbank”: chữ “r” và “n” có đang giả chữ “m” không?',lessonTitle:'Đọc tên miền từng chữ',clues:['Tên miền “vietcornbank” giả chữ “m” bằng “rn”','Dọa tài khoản sắp bị khóa','Thúc bấm vào trang đăng nhập lạ'],safeAction:'Không mở trang trong tin nhắn. Hãy tự mở ứng dụng ngân hàng hoặc gọi số in trên thẻ.'},
 {sender:'Người tự xưng là con',detail:'Số mới · 08•• ••• 527',channel:'Tin nhắn cá nhân',time:'Hôm nay · 13:02',focus:'Mạo danh người thân',hint:'Bác có thể gọi lại số cũ hoặc hỏi điều chỉ người nhà biết không?',lessonTitle:'Số mới phải xác minh lại',clues:['Đột ngột báo đổi số điện thoại','Thúc chuyển học phí ngay','Chưa có cách nào chứng minh đúng là người thân'],safeAction:'Gọi lại số cũ hoặc gọi video. Chỉ chuyển tiền sau khi đã nghe đúng giọng và xác minh rõ.'},
 {sender:'Phòng khám quen',detail:'Tổng đài đã lưu trong danh bạ',channel:'Tin nhắn nhắc lịch',time:'Hôm nay · 14:10',focus:'Thông báo bình thường',hint:'Tin có đòi tiền, mật khẩu hoặc yêu cầu bấm đường dẫn lạ không?',lessonTitle:'Kiểm tra điều tin nhắn yêu cầu',clues:['Lịch hẹn khớp nơi bác thường khám','Không đòi tiền hoặc thông tin bí mật','Không có đường dẫn hay tệp cài đặt'],safeAction:'Đối chiếu lịch đã đặt. Nếu thông tin không khớp, gọi số phòng khám bác đã lưu để hỏi lại.'},
 {sender:'KHO-QUA-TANG',detail:'Số quảng cáo chưa xác minh',channel:'Tin nhắn quảng cáo',time:'Hôm nay · 15:36',focus:'Phí nhận thưởng',hint:'Bác có tham gia quay thưởng không, và vì sao phải trả tiền trước?',lessonTitle:'Không đóng phí để nhận quà bất ngờ',clues:['Báo trúng dù bác không tham gia','Đòi đóng 2 triệu đồng trước','Dùng phần thưởng lớn để làm bác mất cảnh giác'],safeAction:'Không trả bất kỳ khoản phí nào. Chặn người gửi và báo tin nhắn rác hoặc lừa đảo.'},
 {sender:'Ngân hàng của bác',detail:'Brandname NGANHANG',channel:'Tin nhắn giao dịch',time:'Hôm nay · 16:18',focus:'Kênh liên hệ chính thức',hint:'Tin đưa đường dẫn lạ, hay chỉ nhắc bác gọi số in trên thẻ?',lessonTitle:'Tự gọi số chính thức khi nghi ngờ',clues:['Không đưa đường dẫn đăng nhập','Hướng dẫn dùng số ở mặt sau thẻ','Không xin OTP, mật khẩu hoặc chuyển tiền'],safeAction:'Nếu giao dịch không phải của bác, tự gọi số trên thẻ hoặc trong ứng dụng chính thức để khóa giao dịch.'},
 {sender:'Người tự xưng cán bộ',detail:'Tài khoản Zalo chưa xác minh',channel:'Tin nhắn kèm tệp',time:'Hôm nay · 17:05',focus:'Tệp cài đặt lạ',hint:'VNeID chính thức phải tải từ kho ứng dụng hay từ tệp gửi qua chat?',lessonTitle:'Không cài tệp APK được gửi qua chat',clues:['Gửi tệp “VNeID.apk” qua trò chuyện','Tự xưng cán bộ nhưng tài khoản chưa xác minh','Đòi cài ứng dụng ngoài kho chính thức'],safeAction:'Không mở tệp. Xóa tệp và chỉ tải VNeID từ App Store hoặc Google Play chính thức.'},
 {sender:'Bạn Lan',detail:'Liên hệ đã lưu trong danh bạ',channel:'Tin nhắn cá nhân',time:'Hôm nay · 18:20',focus:'Trò chuyện bình thường',hint:'Tin có xin tiền, OTP, mật khẩu hoặc gửi đường dẫn lạ không?',lessonTitle:'Không phải tin nhắn nào cũng là lừa đảo',clues:['Nội dung phù hợp cuộc họp lớp','Không xin tiền hay thông tin bí mật','Không thúc ép hoặc đe dọa hậu quả'],safeAction:'Bác có thể trả lời bình thường. Nếu sau đó xuất hiện yêu cầu tiền hoặc đường dẫn lạ, hãy xác minh lại.'}
];
const improvementTips=[
 'Lần sau, hãy phân biệt tin nhắn chỉ cảnh báo bảo mật với tin nhắn yêu cầu cung cấp mã OTP.',
 'Gặp yêu cầu chuyển tiền để xác minh hoặc điều tra, hãy dừng lại và tự gọi cơ quan qua số chính thức.',
 'Hãy đối chiếu đơn đã đặt; chỉ nhận hàng khi thông tin khớp và không cung cấp OTP hay dữ liệu ngân hàng.',
 'Hãy đọc tên miền từng ký tự và mở ứng dụng ngân hàng chính thức thay vì bấm liên kết trong tin nhắn.',
 'Khi người thân dùng số mới và giục chuyển tiền, hãy gọi lại số cũ hoặc hỏi một chi tiết riêng để xác minh.',
 'Hãy kiểm tra xem thông báo có chỉ nhắc lịch hẹn hay còn đòi tiền, dữ liệu hoặc yêu cầu bấm liên kết lạ.',
 'Hãy nhớ quy tắc: không đóng phí trước để nhận một giải thưởng mà mình không chủ động tham gia.',
 'Khi nghi ngờ giao dịch, chỉ gọi số trên thẻ hoặc trong ứng dụng ngân hàng chính thức.',
 'Chỉ cài ứng dụng từ kho chính thức; tuyệt đối không mở tệp APK được gửi qua tin nhắn.',
 'Hãy rà lại bốn dấu hiệu: đòi tiền, hỏi OTP hoặc mật khẩu, tạo áp lực và gửi liên kết lạ.'
];
const savedTraining=load(KEYS.training,{});
const savedQuizAnswers=Array.isArray(savedTraining.answers)&&savedTraining.answers.length===quizData.length?savedTraining.answers.map(answer=>answer==='safe'||answer==='scam'?answer:null):Array(quizData.length).fill(null);
let savedQuiz=Number.isInteger(savedTraining.quiz)&&savedTraining.quiz>=0&&savedTraining.quiz<=quizData.length?savedTraining.quiz:0;
if(savedQuiz===quizData.length&&savedQuizAnswers.some(answer=>answer===null))savedQuiz=savedQuizAnswers.findIndex(answer=>answer===null);
const state={uses:0,analysis:null,text:'',quiz:savedQuiz,score:0,answered:savedQuiz<quizData.length&&savedQuizAnswers[savedQuiz]!==null,quizHint:false,quizChoice:savedQuiz<quizData.length?savedQuizAnswers[savedQuiz]:null,quizAnswers:savedQuizAnswers,simulation:null};
function load(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}} function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
// Escape dữ liệu trước khi đưa vào HTML động để ngăn nội dung tin nhắn chèn mã HTML.
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// Hash chỉ dùng nhận diện tin trùng trong cache, không dùng cho mục đích bảo mật.
function hash(s){let h=2166136261;for(const c of s.trim().toLowerCase())h=(h^c.charCodeAt(0))*16777619;return (h>>>0).toString(36)}
// Điều hướng kiểu SPA: mỗi section có URL riêng và vẫn không phải tải lại toàn trang.
const viewPaths={home:'/',library:'/library',training:'/training',simulation:'/simulation',history:'/history'};
const pathViews=Object.fromEntries(Object.entries(viewPaths).map(([view,path])=>[path,view]));
function viewFromPath(){const path=location.pathname.replace(/\/+$/,'')||'/';return pathViews[path]||'home'}
function showView(id,{updateUrl=false}={}){
  if(!viewPaths[id])id='home';
  $$('.view').forEach(x=>x.classList.toggle('active',x.id===id));
  $$('nav [data-view]').forEach(b=>{const active=b.dataset.view===id;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(id==='history')renderHistory();
  if(id==='library')renderLibrary('Tất cả');
  if(id==='training'&&!$('#quiz').hasChildNodes())renderQuiz();
  if(id==='simulation'&&!$('#simulationStage').hasChildNodes())renderSimulationChooser();
  if(updateUrl&&location.pathname!==viewPaths[id])history.pushState({view:id},'',viewPaths[id]);
  scrollTo(0,0)
}
function clearPreviousResult(){state.analysis=null;state.text='';$('#result').replaceChildren();$('#result').hidden=true;friendlyError('')}
function closeMenu(){$('header').classList.remove('menu-open');$('#menuToggle').innerHTML='<span aria-hidden="true">☰</span>';$('#menuToggle').setAttribute('aria-expanded','false');$('#menuToggle').setAttribute('aria-label','Mở mục lục')}
function navigateToView(id,{clearResult=false}={}){if(clearResult&&id==='home')clearPreviousResult();showView(id,{updateUrl:true});closeMenu()}
$$('[data-view]').forEach(b=>b.onclick=()=>navigateToView(b.dataset.view,{clearResult:b.dataset.view==='home'}));
addEventListener('popstate',()=>showView(viewFromPath()));
$('#menuToggle').onclick=()=>{const open=$('header').classList.toggle('menu-open');$('#menuToggle').innerHTML=`<span aria-hidden="true">${open?'×':'☰'}</span>`;$('#menuToggle').setAttribute('aria-expanded',String(open));$('#menuToggle').setAttribute('aria-label',open?'Đóng mục lục':'Mở mục lục')};
const prefs=load(KEYS.prefs,{}),requestedTheme=new URLSearchParams(location.search).get('theme');document.body.classList.toggle('light-theme',requestedTheme==='light');document.body.classList.toggle('high-contrast',!!prefs.contrast);document.documentElement.classList.toggle('large-text',!!prefs.large);
function syncDisplayControls(){
  const light=document.body.classList.contains('light-theme'),contrast=document.body.classList.contains('high-contrast'),large=document.documentElement.classList.contains('large-text'),themeColor=document.querySelector('meta[name="theme-color"]');
  $('#themeToggle').setAttribute('aria-pressed',String(light));$('#themeToggle').setAttribute('aria-label',light?'Dùng giao diện tối':'Dùng giao diện sáng');$('#themeToggle').setAttribute('title',light?'Dùng giao diện tối':'Dùng giao diện sáng');$('#themeToggle').innerHTML=`<span aria-hidden="true">${light?'☾':'☼'}</span>`;
  $('#contrastToggle').setAttribute('aria-pressed',String(contrast));$('#contrastToggle').setAttribute('aria-label',contrast?'Tắt tương phản cao':'Bật tương phản cao');$('#contrastToggle').setAttribute('title',contrast?'Tắt tương phản cao':'Bật tương phản cao');
  $('#fontSize').setAttribute('aria-pressed',String(large));$('#fontSize').setAttribute('aria-label',large?'Thu nhỏ chữ':'Phóng to chữ');$('#fontSize').setAttribute('title',large?'Thu nhỏ chữ':'Phóng to chữ');$('#fontSize').textContent=large?'A−':'A+';
  document.documentElement.style.colorScheme=contrast?'dark':light?'light':'dark';if(themeColor)themeColor.content=contrast?'#000000':light?'#f7f8ff':'#070b1d'
}
$('#themeToggle').onclick=()=>{document.body.classList.toggle('light-theme');syncDisplayControls()};
$('#contrastToggle').onclick=()=>{document.body.classList.toggle('high-contrast');save(KEYS.prefs,{...load(KEYS.prefs,{}),contrast:document.body.classList.contains('high-contrast')});syncDisplayControls()};
$('#fontSize').onclick=()=>{document.documentElement.classList.toggle('large-text');save(KEYS.prefs,{...load(KEYS.prefs,{}),large:document.documentElement.classList.contains('large-text')});syncDisplayControls()};
syncDisplayControls();
const INPUT_LIMIT_WARNING='Bác đã nhập đủ giới hạn 6.000 ký tự. Hãy rút gọn nội dung trước khi thêm thông tin mới.';
$('#message').oninput=e=>{const length=e.target.value.length;$('#counter').textContent=`${length} / 6000`;if(length>=6000)friendlyError(INPUT_LIMIT_WARNING);else if($('#error').textContent===INPUT_LIMIT_WARNING)friendlyError('')}; $$('.sample').forEach(b=>b.onclick=()=>{$('#message').value=samples[b.dataset.sample];$('#message').dispatchEvent(new Event('input'));$('#message').focus()});
function setBusy(v){$('#loading').hidden=!v;$('#analyze').disabled=v;$('#speak').disabled=v}
function friendlyError(msg){$('#error').textContent=msg;$('#error').hidden=!msg}
// Mỗi request client có AbortController để không chờ vô hạn khi mạng yếu.
async function post(url,body){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),22000);try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal});const j=await r.json();if(!r.ok)throw new Error(j.error||'Yêu cầu thất bại.');return j}finally{clearTimeout(timer)}}
// Luồng phân tích ưu tiên cache; chỉ tăng lượt khi thật sự gọi backend.
$('#analyze').onclick=async()=>{clearPreviousResult();const text=$('#message').value.trim();if(text.length<4)return friendlyError('Bác hãy nhập một tin nhắn dài hơn một chút.');const cache=load(KEYS.cache,[]),key=hash(text),hit=cache.find(x=>x.key===key);if(hit){state.analysis=hit.data;state.text=text;renderResult(hit.data,true);return}if(state.uses>=LIMIT)return friendlyError(`Bác đã dùng hết ${LIMIT} lượt AI trong phiên. Tin đã xem vẫn có trong Lịch sử.`);setBusy(true);$('#streamStatus').textContent='Thám tử đang phân tích cấu trúc và đường dẫn…';state.uses++;$('#usage').textContent=`Đã dùng ${state.uses} / ${LIMIT} lượt AI trong phiên`;const started=Date.now();try{const data=await post('/api/analyze',{text});state.analysis=data;state.text=text;const next=[{key,data},...cache.filter(x=>x.key!==key)].slice(0,30);save(KEYS.cache,next);saveHistory(text,data);logCall(text,data,Date.now()-started);renderResult(data,false)}catch(e){friendlyError(e.name==='AbortError'?'Quá thời gian chờ. Bác thử lại sau ít phút nhé.':'Không kết nối được máy chủ. Bác kiểm tra mạng rồi thử lại.')}finally{setBusy(false)}};
// Nhật ký chỉ lưu metadata cần đo lường, không lưu thêm dữ liệu ngoài nội dung lịch sử đã chọn.
function logCall(text,data,ms){const logs=load(KEYS.logs,[]);logs.push({at:new Date().toISOString(),inputLength:text.length,risk:data.detective.risk,signals:data.detective.signals.length,durationMs:ms,ai:data.meta?.ai});save(KEYS.logs,logs)}
// Lịch sử giới hạn 10 tin; tin mới đẩy tin cũ nhất ra ngoài.
function saveHistory(text,data){const list=load(KEYS.history,[]).filter(x=>x.key!==hash(text));list.unshift({key:hash(text),at:Date.now(),text,data});save(KEYS.history,list.slice(0,10))}
// Chỉ tô các đoạn trích tìm thấy; trích dẫn lệch không gây lỗi hoặc thay đổi văn bản gốc.
function highlight(text,signals){let chunks=[{t:text,m:false}];for(const s of signals){if(!s.quote)continue;chunks=chunks.flatMap(c=>{if(c.m)return[c];const i=c.t.toLocaleLowerCase().indexOf(s.quote.toLocaleLowerCase());return i<0?[c]:[{t:c.t.slice(0,i),m:false},{t:c.t.slice(i,i+s.quote.length),m:true},{t:c.t.slice(i+s.quote.length),m:false}]})}return chunks.map(c=>c.m?`<mark>${esc(c.t)}</mark>`:esc(c.t)).join('')}
// Kết quả An toàn không hiện luồng ứng cứu hoặc ảnh chia sẻ cảnh báo.
function renderResult(data,cached){
  const d=data.detective,cls=d.risk==='An toàn'?'safe':d.risk==='Nghi ngờ'?'suspect':'danger';
  const urls=(data.local?.urls||[]).filter(x=>x.suspicious);
  const safeReminder=d.risk==='An toàn'&&(data.local?.securityAdvice||d.signals.length)?d.actions[0]:'';
  const guidance=d.risk==='An toàn'?(safeReminder?`<article class="result-card"><h2>Lưu ý</h2><p>${esc(safeReminder)}</p></article>`:''):`<article class="result-card"><h2>3 việc nên làm</h2><ol class="actions">${d.actions.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></article>`;
  const emergency=d.risk==='An toàn'?'':`<article class="result-card"><h2>Bác đã làm gì rồi?</h2><p>Chọn một đáp án để nhận hướng dẫn ứng cứu phù hợp.</p><div class="scenario-grid"><button data-scenario="none">Chưa làm gì</button><button data-scenario="clicked">Đã bấm đường dẫn</button><button data-scenario="shared">Đã đưa thông tin / OTP</button><button data-scenario="paid">Đã chuyển tiền</button></div><div id="response"></div></article>`;
  const warningShare=d.risk==='An toàn'?'':`<article class="result-card"><h2>Chia sẻ cảnh báo</h2><canvas id="shareCard" class="share-canvas" width="1080" height="1080"></canvas><p><button id="downloadCard" class="primary">Lưu hoặc chia sẻ ảnh</button></p></article>`;
  $('#result').innerHTML=`<div class="risk ${cls}"><p>Kết luận của Thám tử</p><h2>${esc(d.risk)}</h2><span>${cached?'Kết quả được lấy từ dữ liệu đã lưu trước đó — không tốn lượt AI':data.meta?.ai?'Đã phân tích bằng AI + lớp luật':'Kết quả từ lớp luật an toàn'}</span></div><article class="result-card"><h2>Tin đã đánh dấu</h2><p>${highlight(state.text,d.signals)}</p>${urls.map(x=>`<div class="url-warning"><strong>Cảnh báo ${esc(x.host)}</strong><br>${esc(x.reason)}</div>`).join('')}</article><article class="result-card"><h2>Dấu hiệu phát hiện</h2><ul class="signals">${d.signals.length?d.signals.map(x=>`<li><strong>${esc(x.reason)}</strong>${x.quote?`<br><q>${esc(x.quote)}</q>`:''}</li>`).join(''):'<li>Chưa thấy dấu hiệu lừa đảo rõ ràng. Vẫn kiểm tra người gửi nếu bác chưa chắc chắn.</li>'}</ul></article>${guidance}${data.psychology?`<article class="result-card"><h2>Góc nhìn tâm lý</h2><p>${esc(data.psychology.explanation)}</p></article>`:''}${data.psychologyError?`<div class="notice">${esc(data.psychologyError)}</div>`:''}${emergency}${warningShare}`;
  $('#result').hidden=false;
  $$('[data-scenario]').forEach(b=>b.onclick=()=>respond(b));
  if(d.risk!=='An toàn'){drawCard(d);$('#downloadCard').onclick=downloadCard}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#result').scrollIntoView({behavior:reduced?'auto':'smooth'})
}
// Câu nói mẫu chỉ hiện ở bước cần giao tiếp, không hiện cho thao tác tự thực hiện.
async function respond(button){$$('[data-scenario]').forEach(x=>x.disabled=true);button.classList.add('selected');if(button.dataset.scenario==='none'){$('#response').innerHTML='<p class="notice">Chúc mừng bác!</p>';return}$('#response').innerHTML='<p>Đang chuẩn bị các bước khẩn cấp…</p>';try{const r=await post('/api/respond',{text:state.text,scenario:button.dataset.scenario});const contacts=(r.contacts||[]).map(x=>`<li><a href="tel:${esc(x.phone)}"><strong>${esc(x.phone)}</strong></a> — ${esc(x.name)}<br><span>${esc(x.purpose)}</span></li>`).join('');$('#response').innerHTML=`<h3>Các bước ứng cứu cụ thể</h3><ol class="steps">${r.steps.map(x=>{const needsScript=/(gọi|liên hệ|trình báo|phản ánh|báo cho|yêu cầu|đề nghị)/iu.test(x.action);return `<li><strong>${esc(x.action)}</strong>${needsScript&&x.script?`<br><em>Câu nói mẫu: “${esc(x.script)}”</em>`:''}</li>`}).join('')}</ol>${contacts?`<section class="response-contacts" aria-labelledby="contactTitle"><h3 id="contactTitle">Số cần gọi</h3><ul>${contacts}</ul><p><small>Ưu tiên số trong ứng dụng chính thức hoặc mặt sau thẻ ngân hàng. Không gọi số do người lạ gửi.</small></p></section>`:''}` }catch{$('#response').innerHTML='<p class="notice error">Chưa tải được hướng dẫn. Nếu đã mất tiền, gọi ngay số chính thức trong ứng dụng hoặc mặt sau thẻ ngân hàng, chuẩn bị mã giao dịch và đến công an gần nhất.</p>'}}
// Canvas 1080×1080 phù hợp chia sẻ; QR lấy từ server để không lộ dữ liệu hoặc phụ thuộc CDN.
async function drawCard(d){
  const c=$('#shareCard'),x=c.getContext('2d'),color=d.risk==='An toàn'?'#18b785':d.risk==='Nghi ngờ'?'#d98a26':'#ef5671';
  const bg=x.createLinearGradient(0,0,1080,1080),glow=x.createRadialGradient(900,120,10,900,120,520);
  bg.addColorStop(0,'#111a42');bg.addColorStop(.5,'#080d25');bg.addColorStop(1,'#040611');
  x.fillStyle=bg;x.fillRect(0,0,1080,1080);
  glow.addColorStop(0,'rgba(159,103,255,.55)');glow.addColorStop(.55,'rgba(96,120,255,.16)');glow.addColorStop(1,'rgba(5,7,21,0)');
  x.fillStyle=glow;x.fillRect(0,0,1080,1080);
  try{const logo=new Image();await new Promise((resolve,reject)=>{logo.onload=resolve;logo.onerror=reject;logo.src='./logo.svg'});x.drawImage(logo,64,53,74,74)}catch{}
  x.fillStyle='#fff';x.font='800 48px Manrope, sans-serif';x.fillText('ScamCheck',158,103);
  x.fillStyle='rgba(255,255,255,.6)';x.font='700 20px Manrope, sans-serif';x.fillText('SAFE DIGITAL SPACE',159,133);
  x.fillStyle='rgba(255,255,255,.07)';x.strokeStyle='rgba(191,201,255,.2)';x.lineWidth=2;x.beginPath();x.roundRect(70,190,940,190,28);x.fill();x.stroke();
  x.fillStyle=color;x.beginPath();x.roundRect(70,190,12,190,8);x.fill();
  x.fillStyle='rgba(255,255,255,.62)';x.font='800 22px Manrope, sans-serif';x.fillText('KẾT QUẢ KIỂM TRA',110,245);
  x.fillStyle='#fff';x.font='800 76px Manrope, sans-serif';x.fillText(d.risk,110,330);
  x.font='800 38px Manrope, sans-serif';x.fillText('Dấu hiệu chính',70,470);
  x.fillStyle='rgba(230,234,255,.82)';x.font='500 32px Manrope, sans-serif';wrap(x,(d.signals[0]?.reason||'Chưa thấy dấu hiệu rõ ràng'),70,530,690,47);
  x.fillStyle='rgba(81,228,213,.12)';x.strokeStyle='rgba(81,228,213,.3)';x.beginPath();x.roundRect(70,700,650,150,24);x.fill();x.stroke();
  x.fillStyle='#dffdfa';x.font='600 27px Manrope, sans-serif';wrap(x,'Hãy tự liên hệ tổ chức qua kênh chính thức. Không cung cấp OTP hoặc chuyển tiền.',98,755,590,40);
  x.font='500 23px Manrope, sans-serif';x.fillStyle='rgba(210,218,246,.58)';x.fillText(location.origin,70,1000);
  try{const img=new Image();img.crossOrigin='anonymous';await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src='/api/qr'});x.fillStyle='#fff';x.beginPath();x.roundRect(770,695,250,300,22);x.fill();x.drawImage(img,785,710,220,220);x.fillStyle='#080d25';x.font='800 20px Manrope, sans-serif';x.textAlign='center';x.fillText('Quét để kiểm tra',895,965);x.textAlign='left'}catch{}
}
function wrap(ctx,text,x,y,max,line){const words=text.split(' ');let s='';for(const w of words){if(ctx.measureText(s+w).width>max){ctx.fillText(s,x,y);s=w+' ';y+=line}else s+=w+' '}ctx.fillText(s,x,y)}
async function downloadCard(){
  const canvas=$('#shareCard'),name=`scamcheck-${Date.now()}.png`;
  if(!canvas)return;
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)return friendlyError('Chưa tạo được ảnh. Bác thử lại nhé.');
  const file=new File([blob],name,{type:'image/png'});
  if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],title:'Cảnh báo ScamCheck'});return}catch(error){if(error?.name==='AbortError')return}
  }
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.download=name;a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function formatDateTime(value){return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(value))}
function renderHistory(){const list=load(KEYS.history,[]);$('#historyList').innerHTML=list.length?list.map((x,i)=>`<article class="history-card"><small>${formatDateTime(x.at)}</small><h2>${esc(x.data.detective.risk)}</h2><p>${esc(x.text.slice(0,180))}</p><button class="secondary open-history" data-i="${i}">Xem lại</button><button class="danger delete-history" data-i="${i}">Xoá</button></article>`).join(''):'<div class="panel"><p>Chưa có tin nào được lưu.</p></div>';const logs=load(KEYS.logs,[]);$('#callLogs').innerHTML=logs.length?`<div class="log-table" role="region" aria-label="Nhật ký gọi AI" tabindex="0"><table><thead><tr><th>Ngày và giờ</th><th>Ký tự</th><th>Kết quả</th><th>Thời gian xử lý</th><th>Nguồn</th></tr></thead><tbody>${logs.map(x=>`<tr><td>${formatDateTime(x.at)}</td><td>${x.inputLength}</td><td>${esc(x.risk)}</td><td>${x.durationMs} ms</td><td>${x.ai?'Gemini + luật':'Luật'}</td></tr>`).join('')}</tbody></table></div>`:'<p>Chưa có lần gọi nào trong phiên.</p>';$$('.open-history').forEach(b=>b.onclick=()=>{const x=load(KEYS.history,[])[+b.dataset.i];state.text=x.text;state.analysis=x.data;$('#message').value=x.text;navigateToView('home');renderResult(x.data,true)});$$('.delete-history').forEach(b=>b.onclick=()=>{if(confirm('Xoá tin này khỏi lịch sử?')){const l=load(KEYS.history,[]);l.splice(+b.dataset.i,1);save(KEYS.history,l);renderHistory()}})}
$('#clearHistory').onclick=()=>{if(confirm('Xoá toàn bộ lịch sử? Hành động này không thể hoàn tác.')){save(KEYS.history,[]);renderHistory()}};
$('#exportLogs').onclick=()=>{const blob=new Blob([JSON.stringify(load(KEYS.logs,[]),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='scamcheck-ai-log.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
function renderLibrary(group){const groups=['Tất cả',...new Set(scams.map(x=>x.g))];$('#filters').innerHTML=groups.map(g=>`<button class="${g===group?'active':''}" data-group="${esc(g)}">${esc(g)}</button>`).join('');$('#scamGrid').innerHTML=scams.filter(x=>group==='Tất cả'||x.g===group).map((x,i)=>`<button class="scam-card" data-title="${esc(x.t)}"><span class="tag">${esc(x.g)}</span><h2>${esc(x.t)}</h2><p>${esc(x.d)}</p></button>`).join('');$$('[data-group]').forEach(b=>b.onclick=()=>renderLibrary(b.dataset.group));$$('.scam-card').forEach(b=>b.onclick=()=>{const x=scams.find(s=>s.t===b.dataset.title);$('#scamContent').innerHTML=`<p class="eyebrow">${esc(x.g)}</p><h2>${esc(x.t)}</h2><p>${esc(x.d)}</p><h3>Dấu hiệu</h3><p>${esc(x.sign)}</p><h3>Cách xử lý</h3><p>Dừng tương tác, tự tìm kênh chính thức để xác minh và báo cho người thân.</p>`;$('#scamDetail').showModal()})}
const scamDetail=$('#scamDetail');
$('.dialog-close').onclick=()=>scamDetail.close();
scamDetail.addEventListener('click',event=>{
  const {left,right,top,bottom}=scamDetail.getBoundingClientRect();
  if(event.clientX<left||event.clientX>right||event.clientY<top||event.clientY>bottom)scamDetail.close();
});
function quizScore(){return state.quizAnswers.reduce((score,answer,index)=>score+(answer===quizData[index][1]?1:0),0)}
function saveQuizProgress(){save(KEYS.training,{quiz:state.quiz,answers:state.quizAnswers})}
function openQuizLesson(index,{focus=true}={}){
  if(index<0||index>=quizData.length)return;
  const savedAnswer=state.quizAnswers[index];
  state.quiz=index;
  state.quizChoice=savedAnswer;
  state.answered=savedAnswer!==null;
  state.quizHint=false;
  saveQuizProgress();
  renderQuiz();
  if(focus)requestAnimationFrame(()=>$('#trainingLessonStart')?.focus());
}
function renderQuizOutline(){
  return `<ol class="training-lesson-list">${quizMeta.map((lesson,index)=>{
    const completed=state.quizAnswers[index]!==null,current=index===state.quiz;
    const status=current?'Đang học':completed?'Đã học':'Sắp tới';
    const content=`<span class="training-step-number" aria-hidden="true">${completed?'✓':index+1}</span><span class="training-step-copy"><strong>${esc(lesson.lessonTitle)}</strong><small>${status}</small></span>`;
    return `<li class="${current?'current ':''}${completed?'completed':''}">${completed||current?`<button type="button" data-quiz-lesson="${index}" ${current?'aria-current="step"':''}>${content}</button>`:`<div>${content}</div>`}</li>`;
  }).join('')}</ol>`;
}
function renderQuiz(){
  const root=$('#quiz'),total=quizData.length;
  state.score=quizScore();
  if(state.quiz>=total){
    const scoreMessage=state.score>=8?'Bác đã có phản xạ kiểm tra rất tốt. Hãy tiếp tục giữ thói quen xác minh qua kênh chính thức.':state.score>=6?'Bác đã nắm được nhiều dấu hiệu quan trọng. Luyện lại một lượt sẽ giúp phản xạ chắc hơn.':'Mỗi lần luyện là một lần an toàn hơn. Bác hãy xem lại các quy tắc dưới đây rồi thử lại nhé.';
    root.innerHTML=`<section class="training-complete panel" tabindex="-1">
      <div class="training-complete-mark" aria-hidden="true">✓</div>
      <p class="panel-kicker"><span aria-hidden="true">✦</span> Hoàn thành 10 bài học</p>
      <h2>Bác đã hoàn thành khóa luyện tập</h2>
      <p>${esc(scoreMessage)}</p>
      <div class="training-score-summary"><strong>${state.score}/${total}</strong><span>tình huống nhận diện đúng</span></div>
      <div class="training-rule-grid" aria-label="Bốn quy tắc an toàn cần nhớ">
        <article><span aria-hidden="true">01</span><strong>Không đưa OTP</strong><p>Mã OTP, mật khẩu và mã PIN chỉ để bác tự dùng.</p></article>
        <article><span aria-hidden="true">02</span><strong>Không chuyển tiền để xác minh</strong><p>Cơ quan thật không có “tài khoản an toàn” để điều tra.</p></article>
        <article><span aria-hidden="true">03</span><strong>Không bấm vội</strong><p>Tự mở ứng dụng hoặc gõ địa chỉ chính thức thay vì bấm liên kết lạ.</p></article>
        <article><span aria-hidden="true">04</span><strong>Gọi lại để kiểm tra</strong><p>Dùng số bác đã lưu, số trên thẻ hoặc trang chính thức.</p></article>
      </div>
      <div class="training-complete-actions">
        <button id="restartTraining" class="primary">↻ Luyện lại từ đầu</button>
        <button id="startSimulationFromTraining" class="secondary">Thử hội thoại mô phỏng →</button>
      </div>
    </section>`;
    $('#restartTraining').onclick=()=>{
      state.quizAnswers.fill(null);
      state.score=0;
      openQuizLesson(0);
    };
    $('#startSimulationFromTraining').onclick=()=>navigateToView('simulation');
    requestAnimationFrame(()=>$('.training-complete')?.focus());
    return;
  }

  const q=quizData[state.quiz],meta=quizMeta[state.quiz];
  const completedCount=state.quizAnswers.filter(answer=>answer!==null).length;
  const progress=Math.round(completedCount/total*100);
  const selected=state.quizChoice,answered=state.answered;
  const correct=answered&&selected===q[1];
  const answerClass=value=>{
    if(!answered)return'';
    if(selected===value)return value===q[1]?'is-correct':'is-incorrect';
    return value===q[1]?'is-correct-reveal':'';
  };
  const answerStatus=value=>{
    if(!answered)return'';
    if(selected===value)return`<span class="training-answer-status">${value===q[1]?'✓ Lựa chọn an toàn':'× Bác đã chọn'}</span>`;
    return value===q[1]?'<span class="training-answer-status">✓ Đáp án nên chọn</span>':'';
  };
  const feedback=answered?`<article id="quizFeedback" class="training-feedback feedback ${correct?'correct':'incorrect'}" tabindex="-1" aria-live="polite">
      <div class="training-feedback-head">
        <span class="training-feedback-icon" aria-hidden="true">${correct?'✓':'i'}</span>
        <div><small>${correct?'Lựa chọn an toàn':'Mình cùng xem lại'}</small><h3>${esc(meta.lessonTitle)}</h3></div>
      </div>
      <p>${esc(q[2])}</p>
      <div class="training-learn-grid">
        <section>
          <h4>Dấu hiệu cần nhìn</h4>
          <ul>${meta.clues.map(clue=>`<li>${esc(clue)}</li>`).join('')}</ul>
        </section>
        <section class="training-safe-action">
          <h4>Nếu gặp thật, bác nên…</h4>
          <p>${esc(meta.safeAction)}</p>
        </section>
      </div>
      <div class="training-memory-tip"><strong>Mẹo ghi nhớ</strong><p>${esc(improvementTips[state.quiz])}</p></div>
    </article>
    <div class="training-next-row"><span>Không cần ghi nhớ hết ngay. Quan trọng nhất là biết dừng lại để kiểm tra.</span><button id="nextQuiz" class="primary">${state.quiz===total-1?'Xem kết quả':'Bài tiếp theo'} <span aria-hidden="true">→</span></button></div>`:'';

  root.innerHTML=`<section class="training-coursebar panel" aria-label="Tiến độ khóa học">
      <div><span>Khóa học nhận diện lừa đảo</span><strong>${completedCount}/${total} bài đã học</strong></div>
      <div class="training-progress" role="progressbar" aria-label="Tiến độ luyện tập" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div>
      <b>${progress}%</b>
    </section>
    <div class="training-layout">
      <article class="training-lesson panel">
        <div class="training-lesson-head">
          <div><span class="training-count">Bài ${state.quiz+1} / ${total}</span></div>
          <span class="training-no-pressure">Không tính giờ · Có thể xem gợi ý</span>
        </div>
        <div id="trainingLessonStart" class="training-scenario-label" tabindex="-1"><span aria-hidden="true">◈</span> Tình huống vừa nhận được</div>
        <article class="training-message-card" aria-label="Nội dung tình huống">
          <div class="training-message-head">
            <span class="training-sender-avatar" aria-hidden="true">${esc(meta.sender.slice(0,1))}</span>
            <span class="training-sender-copy"><strong>${esc(meta.sender)}</strong><small>${esc(meta.detail)}</small></span>
            <time>${esc(meta.time)}</time>
          </div>
          <blockquote class="quiz-message"><p>${esc(q[0])}</p></blockquote>
        </article>
        <section class="training-question">
          <div>
            <p class="training-question-kicker">Quan sát kỹ rồi chọn</p>
            <h2 id="trainingQuestion" tabindex="-1">Theo bác, tình huống này thế nào?</h2>
          </div>
          <button id="quizHintButton" class="training-hint-button" type="button" aria-expanded="${state.quizHint}" aria-controls="trainingHint"><span aria-hidden="true">◎</span> ${state.quizHint?'Ẩn gợi ý':'Xem gợi ý'}</button>
        </section>
        <div id="trainingHint" class="training-hint" tabindex="-1" ${state.quizHint?'':'hidden'}><strong>Gợi ý quan sát</strong><p>${esc(meta.hint)}</p></div>
        <div class="quiz-options" role="group" aria-labelledby="trainingQuestion">
          <button class="training-answer scam-answer answer ${answerClass('scam')}" data-quiz-answer="scam" ${answered?'disabled':''}>
            <span class="training-answer-icon" aria-hidden="true">!</span>
            <span><strong>Có dấu hiệu lừa đảo</strong><small>Dừng lại và kiểm tra trước khi làm theo</small></span>
            ${answerStatus('scam')}
          </button>
          <button class="training-answer safe-answer answer ${answerClass('safe')}" data-quiz-answer="safe" ${answered?'disabled':''}>
            <span class="training-answer-icon" aria-hidden="true">✓</span>
            <span><strong>Có vẻ an toàn</strong><small>Không thấy yêu cầu nguy hiểm rõ ràng</small></span>
            ${answerStatus('safe')}
          </button>
        </div>
        <div id="feedback">${feedback}</div>
      </article>
      <aside class="training-rail" aria-label="Nội dung khóa học">
        <section class="training-outline panel">
          <div class="training-rail-heading"><span>Tiến trình học</span><strong>${completedCount} / ${total}</strong></div>
          ${renderQuizOutline()}
        </section>
        <section class="training-checklist panel">
          <p class="panel-kicker"><span aria-hidden="true">✦</span> Kiểm tra nhanh</p>
          <h3>4 câu hỏi trước khi tin</h3>
          <ul>
            <li><span aria-hidden="true">1</span>Có xin tiền hoặc chuyển khoản?</li>
            <li><span aria-hidden="true">2</span>Có hỏi OTP hoặc mật khẩu?</li>
            <li><span aria-hidden="true">3</span>Có thúc ép hoặc dọa hậu quả?</li>
            <li><span aria-hidden="true">4</span>Có đường dẫn, tệp hay số lạ?</li>
          </ul>
          <p class="training-checklist-note"><strong>Chỉ cần một câu “Có”:</strong> hãy dừng lại và xác minh.</p>
        </section>
      </aside>
    </div>`;

  $('#quizHintButton').onclick=()=>{
    state.quizHint=!state.quizHint;
    renderQuiz();
    requestAnimationFrame(()=>state.quizHint?$('#trainingHint')?.focus():$('#quizHintButton')?.focus());
  };
  root.querySelectorAll('[data-quiz-answer]').forEach(button=>button.onclick=()=>{
    if(state.quizAnswers[state.quiz]!==null)return;
    state.quizChoice=button.dataset.quizAnswer;
    state.quizAnswers[state.quiz]=state.quizChoice;
    state.answered=true;
    state.score=quizScore();
    saveQuizProgress();
    renderQuiz();
    requestAnimationFrame(()=>$('#quizFeedback')?.focus());
  });
  root.querySelectorAll('[data-quiz-lesson]').forEach(button=>button.onclick=()=>openQuizLesson(Number(button.dataset.quizLesson)));
  $('#nextQuiz')?.addEventListener('click',()=>{
    if(state.quiz<total-1)openQuizLesson(state.quiz+1);
    else{
      state.quiz=total;
      state.quizChoice=null;
      state.answered=false;
      state.quizHint=false;
      saveQuizProgress();
      renderQuiz();
    }
  });
}
// Mô phỏng phân nhánh chạy hoàn toàn cục bộ và dùng dữ liệu thuần có thể kiểm thử bằng Node.
function renderSimulationChooser(){
  const scenarios=window.ScamSimulation?.scenarios||{};
  $('#simulationStage').innerHTML=`<div class="simulation-intro panel"><div><div class="panel-kicker"><span aria-hidden="true">✦</span> Phòng tập phản xạ</div><h2>Chọn một cuộc hội thoại</h2><p>Hãy trả lời như khi tình huống thật đang diễn ra. Sau mỗi quyết định, ScamCheck sẽ giải thích thủ thuật tâm lý vừa được sử dụng.</p></div><div class="simulation-note"><strong>An toàn tuyệt đối</strong><span>Không gọi API · Không lưu câu trả lời · Có thể chơi lại</span></div></div><div class="simulation-scenarios">${Object.entries(scenarios).map(([id,s])=>`<button class="simulation-card" data-simulation="${esc(id)}"><span class="simulation-card-top"><span class="simulation-avatar" aria-hidden="true">${esc(s.avatar)}</span><span><small>${esc(s.category)}</small><strong>${esc(s.title)}</strong></span></span><span class="simulation-card-copy">${esc(s.description)}</span><span class="simulation-card-meta"><span>${esc(s.difficulty)}</span><span>${esc(s.duration)}</span><b>Chơi ngay →</b></span></button>`).join('')}</div>`;
  $$('[data-simulation]').forEach(button=>button.onclick=()=>startSimulation(button.dataset.simulation));
}
function startSimulation(scenarioId){
  const scenario=window.ScamSimulation?.scenarios?.[scenarioId];
  if(!scenario)return;
  const node=scenario.nodes[scenario.start];
  state.simulation={scenarioId,nodeId:scenario.start,score:50,step:1,transcript:[{who:'scammer',text:node.message}],signals:[...node.signals],feedback:null,pending:null,ending:null};
  renderSimulation();
}
function renderSimulation(){
  const game=state.simulation,api=window.ScamSimulation;
  if(!game||!api)return renderSimulationChooser();
  const scenario=api.scenarios[game.scenarioId];
  if(game.ending)return renderSimulationEnding(scenario,game,api);
  const node=scenario.nodes[game.nodeId],label=api.shieldLabel(game.score);
  $('#simulationStage').innerHTML=`<div class="simulation-toolbar"><button id="leaveSimulation" class="secondary">← Đổi kịch bản</button><div><span>Quyết định ${game.step}</span><strong>${esc(scenario.title)}</strong></div></div><div class="simulation-layout"><article class="simulation-phone" aria-label="Cuộc hội thoại mô phỏng"><header class="simulation-phone-head"><span class="simulation-avatar" aria-hidden="true">${esc(scenario.avatar)}</span><span><strong>${esc(scenario.sender)}</strong><small>Đang trò chuyện · mô phỏng</small></span></header><div id="simulationLog" class="simulation-log" role="log" aria-live="polite" aria-relevant="additions">${game.transcript.map(item=>`<div class="simulation-bubble ${item.who==='user'?'user':'scammer'}"><span>${item.who==='user'?'Bác':'Người gửi'}</span>${esc(item.text)}</div>`).join('')}</div><div class="simulation-signals"><span>Dấu hiệu đã lộ:</span>${game.signals.map(signal=>`<b>${esc(signal)}</b>`).join('')}</div></article><aside class="simulation-decision panel"><div class="shield-row"><div><small>Khiên an toàn</small><strong>${esc(label)}</strong></div><b>${game.score}/100</b></div><div class="shield-track" role="progressbar" aria-label="Điểm Khiên an toàn" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${game.score}"><span style="width:${game.score}%"></span></div>${game.feedback?renderSimulationFeedback(game):`<div class="decision-prompt"><span>Bác sẽ làm gì?</span><p>Chọn một cách phản hồi để tiếp tục câu chuyện.</p></div><div class="simulation-choices">${node.choices.map((choice,index)=>`<button data-sim-choice="${index}"><span>${index+1}</span>${esc(choice.text)}</button>`).join('')}</div>`}</aside></div>`;
  $('#leaveSimulation').onclick=()=>{state.simulation=null;renderSimulationChooser()};
  $$('[data-sim-choice]').forEach(button=>button.onclick=()=>chooseSimulation(Number(button.dataset.simChoice)));
  $('#continueSimulation')?.addEventListener('click',continueSimulation);
  requestAnimationFrame(()=>{const log=$('#simulationLog');if(log)log.scrollTop=log.scrollHeight});
}
function renderSimulationFeedback(game){
  const delta=game.feedback.delta,tone=delta>5?'good':delta<0?'bad':'neutral',change=delta>0?`+${delta}`:`${delta}`;
  return `<div class="simulation-feedback ${tone}" aria-live="polite"><span>${delta===0?'Không đổi':`${change} điểm Khiên`}</span><strong>${delta>5?'Phản xạ tốt':delta<0?'Cẩn thận — đang vào bẫy':'Chưa đủ để xác minh'}</strong><p>${esc(game.feedback.text)}</p></div><button id="continueSimulation" class="primary">${game.pending.ending?'Xem kết quả':'Xem tin nhắn tiếp theo'} <span aria-hidden="true">→</span></button>`;
}
function chooseSimulation(choiceIndex){
  const game=state.simulation,api=window.ScamSimulation;
  if(!game||game.feedback)return;
  const result=api.resolveChoice(game.scenarioId,game.nodeId,choiceIndex,game.score);
  game.score=result.score;
  game.transcript.push({who:'user',text:result.choice.reply});
  game.feedback={text:result.choice.feedback,delta:result.choice.delta};
  game.pending={next:result.next,ending:result.endingId};
  renderSimulation();
}
function continueSimulation(){
  const game=state.simulation,api=window.ScamSimulation;
  if(!game?.pending)return;
  if(game.pending.ending){
    game.ending=api.endings[game.pending.ending];
    game.endingId=game.pending.ending;
    game.feedback=null;game.pending=null;
    return renderSimulation();
  }
  const scenario=api.scenarios[game.scenarioId],next=scenario.nodes[game.pending.next];
  game.nodeId=game.pending.next;game.step++;game.transcript.push({who:'scammer',text:next.message});
  game.signals=[...new Set([...game.signals,...next.signals])];
  game.feedback=null;game.pending=null;
  renderSimulation();
}
function renderSimulationEnding(scenario,game,api){
  const ending=game.ending,label=api.shieldLabel(game.score);
  $('#simulationStage').innerHTML=`<article class="simulation-ending ${esc(ending.tone)}"><div class="ending-icon" aria-hidden="true">${ending.tone==='safe'?'✓':ending.tone==='suspect'?'!':'×'}</div><p class="eyebrow">Kết thúc kịch bản · ${esc(scenario.category)}</p><h2>${esc(ending.title)}</h2><p>${esc(ending.body)}</p><div class="ending-score"><span>Khiên an toàn cuối cùng</span><strong>${game.score}/100 · ${esc(label)}</strong></div>${game.endingId==='danger'?'<div class="ending-alert"><strong>Nếu đây là tình huống thật:</strong> Dừng liên lạc, gọi ngân hàng qua số chính thức và lưu lại bằng chứng ngay.</div>':''}<div class="ending-lessons"><h3>Ba điều cần nhớ</h3><ol>${scenario.lessons.map(lesson=>`<li>${esc(lesson)}</li>`).join('')}</ol></div><div class="ending-actions"><button id="replaySimulation" class="primary">Chơi lại kịch bản</button><button id="chooseSimulation" class="secondary">Chọn kịch bản khác</button></div></article>`;
  $('#replaySimulation').onclick=()=>startSimulation(game.scenarioId);
  $('#chooseSimulation').onclick=()=>{state.simulation=null;renderSimulationChooser()};
}
// Ưu tiên Web Speech API; nếu Safari không hỗ trợ thì hướng dẫn dùng micro bàn phím hệ điều hành.
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(SpeechRecognition){const rec=new SpeechRecognition();rec.lang='vi-VN';rec.continuous=true;rec.onresult=e=>{$('#message').value=[...e.results].map(x=>x[0].transcript).join(' ');$('#message').dispatchEvent(new Event('input'))};rec.onend=()=>{$('#speak').textContent='Đọc bằng giọng nói';$('#speak').setAttribute('aria-pressed','false')};$('#speak').onclick=()=>{if($('#speak').getAttribute('aria-pressed')==='true'){rec.stop()}else{try{rec.start();$('#speak').textContent='Dừng ghi âm';$('#speak').setAttribute('aria-pressed','true')}catch{}}}}else{$('#speak').onclick=()=>friendlyError('Trình duyệt này chưa hỗ trợ nhập giọng nói. Bác có thể dùng nút micro trên bàn phím.')}
renderLibrary('Tất cả');renderQuiz();showView(viewFromPath());
const resultAlignmentObserver=new MutationObserver(()=>setTimeout(()=>{const verdict=$('#result .risk');if(!verdict)return;const headerHeight=$('header').getBoundingClientRect().height;const top=Math.max(0,scrollY+verdict.getBoundingClientRect().top-headerHeight-32);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;scrollTo({top:scrollY,behavior:'auto'});requestAnimationFrame(()=>scrollTo({top,behavior:reduced?'auto':'smooth'}))},0));resultAlignmentObserver.observe($('#result'),{childList:true});
