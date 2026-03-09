import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">CheckIn</span>
        </div>
        {user ? (
          <Link to="/dashboard" className="btn-primary text-sm">
            Dashboard
          </Link>
        ) : (
          <Link to="/login" className="btn-secondary text-sm">
            Đăng nhập
          </Link>
        )}
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span>QR Code điểm danh</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Điểm danh sự kiện
            <span className="text-primary-600"> dễ dàng</span>
          </h1>

          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Tạo QR code cho sự kiện, người tham dự chỉ cần quét là điểm danh xong.
            Không cần đăng ký, không cần ứng dụng.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={user ? '/create' : '/login'}
              className="btn-primary text-base py-3 px-8"
            >
              Tạo sự kiện
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary text-base py-3 px-8"
            >
              Xem cách dùng
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="how-it-works" className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto w-full">
          {[
            {
              icon: '🎯',
              title: 'Tạo sự kiện',
              desc: 'Đăng nhập bằng Google, tạo sự kiện và nhận QR code ngay lập tức.',
            },
            {
              icon: '📱',
              title: 'Quét QR code',
              desc: 'Người tham dự quét QR, nhập tên và điểm danh — không cần đăng ký.',
            },
            {
              icon: '📊',
              title: 'Theo dõi',
              desc: 'Xem danh sách điểm danh theo thời gian thực và quản lý thanh toán.',
            },
          ].map((f) => (
            <div key={f.title} className="card text-left">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        © 2026 CheckIn App
      </footer>
    </div>
  )
}
