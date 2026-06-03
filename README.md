# SGC – Form Ứng Tuyển

Project riêng chỉ chứa trang form ứng tuyển cho ứng viên.  
Deploy độc lập trên Cloudflare Pages với domain khác hoàn toàn so với app quản trị.

---

## 🚀 Hướng dẫn deploy lên Cloudflare Pages

### Bước 1 – Push lên GitHub
1. Tạo repo mới trên GitHub (VD: `sgc-form`)
2. Giải nén file zip này vào thư mục
3. Chạy lệnh:
```bash
npm install
git init
git add .
git commit -m "init"
git remote add origin https://github.com/ten-cua-ban/sgc-form.git
git push -u origin main
```

### Bước 2 – Tạo project trên Cloudflare Pages
1. Vào https://dash.cloudflare.com → **Pages** → **Create a project**
2. Chọn **Connect to Git** → chọn repo `sgc-form`
3. Cấu hình build:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### Bước 3 – Điền biến môi trường (QUAN TRỌNG)
Vào **Settings → Environment Variables** → thêm 4 biến:

| Tên biến | Giá trị |
|---|---|
| `VITE_SUPABASE_URL` | URL Supabase của bạn |
| `VITE_SUPABASE_ANON_KEY` | Anon Key Supabase |
| `VITE_GROUP_CODE` | Mã nhóm trong bảng `settings_groups` (VD: `FORM`) |
| `VITE_GROUP_NAME` | Tên nhóm (VD: `Thông tin ứng viên (Điền theo Form)`) |

### Bước 4 – Deploy & lấy link
- Cloudflare sẽ tự build và deploy
- Bạn sẽ có link dạng: `sgc-form.pages.dev` (hoặc tên bạn đặt)
- **Đây là link dùng để tạo QR code trong app quản trị**

---

## 🔄 Cập nhật QR code trong app quản trị

Sau khi có link form mới (`sgc-form.pages.dev`), vào app quản trị:
- Bấm **"Tạo mã QR"**
- QR lúc này sẽ trỏ vào `tqt-web-td.pages.dev/form` (link cũ)
- Cần sửa lại trong `App.tsx` phần `getFormUrl()` để trỏ vào `sgc-form.pages.dev`

Hoặc đơn giản hơn: **tạo QR thủ công** trỏ thẳng vào `https://sgc-form.pages.dev`  
tại https://qr.io hoặc https://www.qrcode-monkey.com/

---

## 📋 Thông tin ứng viên được lưu

Khi ứng viên submit form, dữ liệu được lưu vào bảng `candidates` trong Supabase với:
- `group_type` = `VITE_GROUP_CODE` bạn đã cấu hình
- `recruitment_status` = `P.TD chưa liên hệ` (mặc định)
- Các trường: họ tên, năm sinh, SĐT, vị trí, địa điểm, ghi chú
