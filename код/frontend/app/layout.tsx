import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-EDM Закупки',
  description: 'Электронный документооборот закупок с AI-анализом',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* Навигация */}
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                <div className="flex items-center gap-6">
                  <Link href="/" className="text-indigo-600 font-bold text-lg tracking-tight">
                    AI-EDM
                  </Link>
                  <div className="flex items-center gap-1">
                    <NavLink href="/deals">Сделки</NavLink>
                    <NavLink href="/dashboard">Дашборд</NavLink>
                    <NavLink href="/search">Поиск</NavLink>
                  </div>
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">
                  ООО «ФармПроизводство» · MVP
                </span>
              </div>
            </div>
          </nav>

          {/* Контент */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
    >
      {children}
    </Link>
  )
}
