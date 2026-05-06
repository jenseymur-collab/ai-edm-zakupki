import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-10">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white px-8 py-12 sm:px-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            🚀 MVP · Фармацевтическая закупка
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            AI-EDM Закупки
          </h1>
          <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
            Электронный документооборот закупок с AI-анализом для ООО «ФармПроизводство».
            Контроль сделок, цепочки согласования и семантический поиск по документам.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
            >
              📋 Открыть сделки
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white/15 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-white/25 transition-colors text-sm border border-white/20"
            >
              📊 Дашборд
            </Link>
          </div>
        </div>
      </div>

      {/* Разделы системы */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Разделы системы</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <Link href="/deals" className="card p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">Сделки</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Список закупок с KPI, статусами и документами. Загрузка документов и визирование прямо из карточки.
            </p>
            <div className="mt-4 text-xs text-indigo-500 font-medium group-hover:text-indigo-700">
              Открыть →
            </div>
          </Link>

          <Link href="/dashboard" className="card p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">Дашборд</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              KPI по сделкам, просроченные визы с алертом, лента событий в реальном времени.
            </p>
            <div className="mt-4 text-xs text-indigo-500 font-medium group-hover:text-indigo-700">
              Открыть →
            </div>
          </Link>

          <Link href="/search" className="card p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="text-2xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">AI-поиск</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Семантический поиск по всем документам через pgvector. Понимает смысл, а не только ключевые слова.
            </p>
            <div className="mt-4 text-xs text-indigo-500 font-medium group-hover:text-indigo-700">
              Открыть →
            </div>
          </Link>

        </div>
      </div>

      {/* AI-возможности */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">AI-возможности</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="card p-5 flex gap-4">
            <div className="text-2xl shrink-0">🤖</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Извлечение полей</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                LLM автоматически извлекает реквизиты из любого документа: сумму, стороны, сроки, ИНН — по типу документа.
              </p>
            </div>
          </div>

          <div className="card p-5 flex gap-4">
            <div className="text-2xl shrink-0">📋</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Проверка полноты</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI проверяет, все ли обязательные документы загружены в сделку. Учитывает профиль: стандарт или малая закупка.
              </p>
            </div>
          </div>

          <div className="card p-5 flex gap-4">
            <div className="text-2xl shrink-0">⚠️</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Анализ задержек</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI анализирует просроченные визы, выявляет риски и предлагает конкретные действия по эскалации.
              </p>
            </div>
          </div>

          <div className="card p-5 flex gap-4">
            <div className="text-2xl shrink-0">🔍</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Сравнение версий</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                LLM сравнивает две версии договора, выделяет изменения по пунктам и оценивает юридические риски.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Стек */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Технологический стек</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'FastAPI', 'SQLAlchemy 2.0', 'PostgreSQL 16', 'pgvector',
            'Next.js 14', 'TypeScript', 'Tailwind CSS',
            'OpenRouter LLM', 'text-embedding-3-small', 'Docker Compose',
          ].map(т => (
            <span key={т} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              {т}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
