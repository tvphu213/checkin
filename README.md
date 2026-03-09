# CheckIn App — Điểm danh sự kiện bằng QR Code

Web app cho phép ban tổ chức tạo sự kiện và chia sẻ QR code để người tham dự điểm danh nhanh chóng, không cần đăng ký tài khoản.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **QR Code**: qrcode.js
- **Routing**: React Router v6

---

## 1. Cài đặt Supabase

### 1.1 Tạo project

1. Vào [supabase.com](https://supabase.com) → New project
2. Lưu lại **Project URL** và **anon public key** (Settings → API)

### 1.2 Chạy migration SQL

Vào **SQL Editor** trong Supabase dashboard, chạy:

```sql
-- Bảng events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cost INTEGER,
  type TEXT CHECK (type IN ('one-time', 'recurring')),
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng attendances
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  checked_in_at TIMESTAMP DEFAULT NOW(),
  has_paid BOOLEAN DEFAULT FALSE
);

-- Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own events" ON events
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can read attendances" ON attendances
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert attendances" ON attendances
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only event owners can update payment status" ON attendances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = attendances.event_id
      AND events.owner_id = auth.uid()
    )
  );
```

### 1.3 Bật Google OAuth

1. Supabase dashboard → **Authentication** → **Providers** → Google
2. Bật Google provider
3. Tạo OAuth credentials tại [Google Cloud Console](https://console.cloud.google.com):
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Authorized redirect URIs: `https://<project-id>.supabase.co/auth/v1/callback`
4. Copy **Client ID** và **Client Secret** vào Supabase

### 1.4 Cấu hình Session (7 ngày)

Supabase dashboard → **Authentication** → **Settings**:
- JWT expiry: `604800` (7 ngày tính bằng giây)

---

## 2. Cài đặt & Chạy local

```bash
# Clone / cd vào thư mục project
cd checkin

# Cài dependencies
npm install

# Tạo file .env
cp .env.example .env
```

Điền vào `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

```bash
# Chạy dev server
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173)

---

## 3. Deploy lên Vercel / Netlify

### Vercel

```bash
npm install -g vercel
vercel
```

Thêm environment variables trong Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Thêm `vercel.json` để handle SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Netlify

Tạo file `public/_redirects`:

```
/*  /index.html  200
```

---

## 4. Cập nhật Redirect URL cho OAuth

Sau khi deploy, cập nhật:

**Supabase** → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/dashboard`

**Google Cloud Console** → OAuth Credentials:
- Authorized redirect URIs: `https://<project-id>.supabase.co/auth/v1/callback`

---

## 5. Cấu trúc thư mục

```
src/
├── components/
│   ├── ProtectedRoute.jsx   # Wrapper bảo vệ routes cần auth
│   ├── QRCodeDisplay.jsx    # Hiển thị + download QR code
│   └── LoadingSpinner.jsx   # Spinner component
├── pages/
│   ├── HomePage.jsx         # Landing page
│   ├── LoginPage.jsx        # Google OAuth login
│   ├── CreateEvent.jsx      # Tạo sự kiện (protected)
│   ├── CheckinPage.jsx      # Điểm danh (public)
│   └── Dashboard.jsx        # Quản lý sự kiện (protected)
├── hooks/
│   └── useAuth.js           # Auth hook (user, signIn, signOut)
├── lib/
│   └── supabase.js          # Supabase client
└── App.jsx                  # Router setup
```

---

## 6. Luồng sử dụng

1. **Ban tổ chức**: Đăng nhập Google → Tạo sự kiện → Nhận QR code → Chia sẻ
2. **Người tham dự**: Quét QR → Nhập tên (nhiều người cùng lúc) → Điểm danh xong
3. **Ban tổ chức**: Dashboard → Xem danh sách → Toggle trạng thái thanh toán
