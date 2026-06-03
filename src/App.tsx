import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (url && key) return createClient(url, key);
  return null;
}

const GROUP_NAME = import.meta.env.VITE_GROUP_NAME || 'Thông tin ứng viên (Điền theo Form)';

// Danh sách tỉnh thành Việt Nam năm 2026 (63 tỉnh thành)
const LOCATIONS = [
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cần Thơ',
  'Cao Bằng',
  'Đà Nẵng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Nội',
  'Hà Tĩnh',
  'Hải Dương',
  'Hải Phòng',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'TP. Hồ Chí Minh',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
];

type FormState = {
  full_name: string;
  birth_year: string;
  phone: string;
  position: string;
  desired_location: string;
  notes: string;
};

type Step = 'loading' | 'form' | 'submitting' | 'success' | 'error' | 'no_config';

const EMPTY: FormState = {
  full_name: '',
  birth_year: '',
  phone: '',
  position: '',
  desired_location: '',
  notes: '',
};

const QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=' + encodeURIComponent('https://sgc-form-td.pages.dev') + '&bgcolor=ffffff&color=1a3a6b&margin=16&ecc=M';

export default function App() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState<Step>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setStep('no_config'); return; }

    sb.from('settings_groups')
      .select('code, name')
      .then(({ data, error }) => {
        if (error || !data) { setStep('no_config'); return; }

        const found = data.find((g: any) =>
          g.name.toLowerCase().trim() === GROUP_NAME.toLowerCase().trim()
        );

        if (found) {
          setGroupCode(found.code);
          setStep('form');
        } else {
          setStep('no_config');
        }
      });
  }, []);

  const set = (key: keyof FormState, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setErrorMsg('Vui lòng nhập họ và tên'); return; }
    if (!form.phone.trim()) { setErrorMsg('Vui lòng nhập số điện thoại'); return; }
    setErrorMsg('');
    setStep('submitting');

    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error('Chưa cấu hình kết nối');

      const { error } = await sb.from('candidates').insert([{
        group_type: groupCode,
        full_name: form.full_name.trim(),
        birth_year: form.birth_year.trim(),
        phone: form.phone.trim(),
        position: form.position,
        desired_location: form.desired_location,
        notes: form.notes.trim(),
        recruitment_status: 'P.TD chưa liên hệ',
        referral_date: new Date().toLocaleDateString('vi-VN'),
      }]);

      if (error) throw error;
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra, vui lòng thử lại');
      setStep('error');
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white placeholder:text-slate-400";
  // Tăng độ đậm màu label: đổi text-slate-500 → text-slate-700
  const labelCls = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5";

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2c5e] via-[#1a3a6b] to-[#1e4480] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-white/60 text-sm font-medium">Đang tải...</p>
      </div>
    </div>
  );

  // ── No config ────────────────────────────────────────────────────────────────
  if (step === 'no_config') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h2 className="text-lg font-black text-slate-800 mb-2">Chưa cấu hình</h2>
        <p className="text-sm text-slate-500">Form chưa được thiết lập đúng. Vui lòng liên hệ bộ phận nhân sự.</p>
      </div>
    </div>
  );

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Đã gửi thành công!</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Cảm ơn bạn đã quan tâm. Phòng nhân sự SGC sẽ liên hệ với bạn sớm nhất có thể.
        </p>
        <button
          onClick={() => { setForm(EMPTY); setStep('form'); }}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm"
        >
          Điền thêm thông tin khác
        </button>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Có lỗi xảy ra</h2>
        <p className="text-sm text-red-500 mb-6 break-words">{errorMsg}</p>
        <button
          onClick={() => setStep('form')}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm"
        >
          Thử lại
        </button>
      </div>
    </div>
  );

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2c5e] via-[#1a3a6b] to-[#1e4480] flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a3a6b] to-[#1e4480] px-6 py-6 relative">
          <div className="pr-24">
            {/* SỬA: Đổi "SGC – Phòng Tuyển Dụng" thành tên công ty đầy đủ */}
            <p className="text-blue-300 text-xs font-bold uppercase tracking-[0.15em] mb-1 leading-tight">
              CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ XÂY DỰNG SGC
            </p>
            <h1 className="text-white text-2xl font-black leading-tight">Đăng ký ứng tuyển</h1>
            <p className="text-blue-200 text-xs mt-1.5 font-medium">{GROUP_NAME}</p>
          </div>

          {/* QR góc phải */}
          <div
            className="absolute top-4 right-4 cursor-pointer"
            onClick={() => setShowQR(true)}
            title="Bấm để xem QR lớn hơn"
          >
            <div className="bg-white rounded-xl p-1.5 shadow-lg hover:scale-105 transition-transform">
              <img
                src={QR_URL}
                alt="QR ứng tuyển"
                className="w-16 h-16 rounded-lg block"
              />
            </div>
            <p className="text-blue-300 text-[9px] text-center mt-1 font-medium">Chia sẻ QR</p>
          </div>
        </div>

        {/* Modal phóng to QR */}
        {showQR && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Quét để ứng tuyển</p>
              <img src={QR_URL} alt="QR lớn" className="w-64 h-64 rounded-xl" />

              {/* Link + nút copy */}
              <div className="w-full flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                <span className="text-slate-500 text-xs flex-1 truncate select-all">sgc-form-td.pages.dev</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://sgc-form-td.pages.dev');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
                >
                  {copied ? '✓ Đã copy' : 'Copy'}
                </button>
              </div>

              {/* Chia sẻ qua Zalo / Messenger */}
              <div className="w-full flex gap-2">
                <a
                  href={`https://zalo.me/share/url?url=${encodeURIComponent('https://sgc-form-td.pages.dev')}&title=${encodeURIComponent('Đăng ký ứng tuyển SGC – Công ty Cổ phần Đầu tư và Xây dựng SGC')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0068ff] hover:bg-[#0055cc] text-white rounded-xl text-xs font-bold transition-all"
                >
                  {/* Zalo icon */}
                  <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" rx="10" fill="white" fillOpacity="0.2"/>
                    <text x="5" y="34" fontSize="26" fontWeight="bold" fill="white" fontFamily="Arial">Z</text>
                  </svg>
                  Zalo
                </a>
                <a
                  href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent('https://sgc-form-td.pages.dev')}&app_id=181477272309&redirect_uri=${encodeURIComponent('https://sgc-form-td.pages.dev')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0099ff] hover:bg-[#007acc] text-white rounded-xl text-xs font-bold transition-all"
                >
                  {/* Messenger icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.914 1.318 5.52 3.396 7.28V22l3.102-1.707A10.7 10.7 0 0012 20.486c5.523 0 10-4.144 10-9.243C22 6.145 17.523 2 12 2zm1.07 12.423l-2.55-2.72-4.977 2.72 5.473-5.81 2.613 2.72 4.913-2.72-5.472 5.81z"/>
                  </svg>
                  Messenger
                </a>
              </div>

              <button
                onClick={() => setShowQR(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="p-6 space-y-4">

          <div>
            <label className={labelCls}>Họ và tên <span className="text-red-400 normal-case font-normal">*</span></label>
            <input type="text" placeholder="Nhập họ và tên đầy đủ"
              value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={inputCls} autoComplete="name" />
          </div>

          <div>
            <label className={labelCls}>Năm sinh</label>
            <input type="number" placeholder="VD: 1995"
              value={form.birth_year} onChange={e => set('birth_year', e.target.value)}
              className={inputCls} min="1950" max={new Date().getFullYear() - 15} />
          </div>

          <div>
            <label className={labelCls}>Số điện thoại <span className="text-red-400 normal-case font-normal">*</span></label>
            <input type="tel" placeholder="VD: 0912 345 678"
              value={form.phone} onChange={e => set('phone', e.target.value)}
              className={inputCls} autoComplete="tel" />
          </div>

          {/* SỬA: Vị trí ứng tuyển → input text thay vì dropdown */}
          <div>
            <label className={labelCls}>Vị trí ứng tuyển</label>
            <input type="text" placeholder="Nhập vị trí bạn muốn ứng tuyển"
              value={form.position} onChange={e => set('position', e.target.value)}
              className={inputCls} />
          </div>

          {/* SỬA: Dropdown địa điểm với đầy đủ 63 tỉnh thành Việt Nam */}
          <div>
            <label className={labelCls}>Địa điểm mong muốn làm việc</label>
            <select value={form.desired_location} onChange={e => set('desired_location', e.target.value)} className={inputCls}>
              <option value="">-- Chọn địa điểm --</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Hồ sơ cá nhân / Ghi chú thêm</label>
            <textarea placeholder="Mô tả kinh nghiệm, bằng cấp, hoặc thông tin bạn muốn chia sẻ..."
              value={form.notes} onChange={e => set('notes', e.target.value)}
              className={inputCls + ' resize-none'} rows={3} />
          </div>

          {errorMsg && step === 'form' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          <button onClick={handleSubmit} disabled={step === 'submitting'}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/30 text-sm flex items-center justify-center gap-2 mt-2">
            {step === 'submitting' ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang gửi...
              </>
            ) : 'Gửi thông tin ứng tuyển →'}
          </button>

          <p className="text-center text-[11px] text-slate-400 leading-relaxed">
            Thông tin của bạn được bảo mật tuyệt đối<br/>và chỉ dùng cho mục đích tuyển dụng tại SGC
          </p>
        </div>
      </div>
    </div>
  );
}
