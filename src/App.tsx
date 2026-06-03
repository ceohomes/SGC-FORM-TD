import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ── Supabase: chỉ cần 3 biến môi trường trên Cloudflare Pages ────────────────
//   VITE_SUPABASE_URL      = https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY = eyJ...
//   VITE_GROUP_NAME        = Thông tin ứng viên (Điền theo Form)

function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (url && key) return createClient(url, key);
  return null;
}

const GROUP_NAME = import.meta.env.VITE_GROUP_NAME || 'Thông tin ứng viên (Điền theo Form)';

const POSITIONS = [
  'Công nhân sản xuất',
  'Kỹ thuật viên',
  'Kỹ sư',
  'Quản lý / Giám sát',
  'Văn phòng / Hành chính',
  'Kế toán / Tài chính',
  'Bán hàng / Kinh doanh',
  'Lái xe / Vận chuyển',
  'Bảo vệ / An ninh',
  'Vệ sinh công nghiệp',
  'Khác',
];

const LOCATIONS = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Bình Dương',
  'Đồng Nai',
  'Thanh Hóa',
  'Nghệ An',
  'Hà Tĩnh',
  'Khác',
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

export default function App() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState<Step>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [groupCode, setGroupCode] = useState('');

  // Tự động tìm group_code theo tên nhóm từ Supabase
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setStep('no_config'); return; }

    sb.from('settings_groups')
      .select('code, name')
      .then(({ data, error }) => {
        if (error || !data) { setStep('no_config'); return; }

        // Tìm nhóm khớp tên (không phân biệt hoa thường)
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
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

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
        <div className="bg-gradient-to-r from-[#1a3a6b] to-[#1e4480] px-6 py-6">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-[0.2em] mb-1">SGC – Phòng Tuyển Dụng</p>
          <h1 className="text-white text-2xl font-black leading-tight">Đăng ký ứng tuyển</h1>
          <p className="text-blue-200 text-xs mt-1.5 font-medium">{GROUP_NAME}</p>
        </div>

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

          <div>
            <label className={labelCls}>Vị trí ứng tuyển</label>
            <select value={form.position} onChange={e => set('position', e.target.value)} className={inputCls}>
              <option value="">-- Chọn vị trí --</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

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
