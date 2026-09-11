import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-600">ارتقاء</span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">البوابة المهنية</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="btn-primary text-sm">تسجيل الدخول</button>
              <button className="btn-secondary text-sm">إنشاء حساب</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-custom py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            منصة ارتقاء
            <span className="text-primary-600 block mt-2">البوابة المهنية</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            بوابتك المتخصصة للخدمات المهنية والتطوير الوظيفي. نقدم استشارات وحلولاً مهنية متكاملة.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-primary text-lg px-8 py-3">
              استكشف الخدمات
            </button>
            <button className="btn-secondary text-lg px-8 py-3">
              تعلم أكثر
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-3">💼</div>
            <h3 className="text-xl font-semibold mb-2">استشارات مهنية</h3>
            <p className="text-gray-600">استشارات متخصصة في الإدارة والأعمال</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2">تحليل الأعمال</h3>
            <p className="text-gray-600">تحليل مالي وإداري متقدم</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-semibold mb-2">تطوير وظيفي</h3>
            <p className="text-gray-600">دعم التطوير المهني والوظيفي</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container-custom py-6">
          <div className="text-center text-gray-500 text-sm">
            © 2026 منصة ارتقاء. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App