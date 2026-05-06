'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { апи, type Дашборд } from '@/lib/api'
import { форматДатыВремени } from '@/lib/helpers'

export default function Дашборд() {
  const [данные, setДанные] = useState<Дашборд | null>(null)
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState<string | null>(null)

  useEffect(() => {
    апи.дашборд()
      .then(setДанные)
      .catch(e => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }, [])

  if (загрузка) return <div className="card p-8 text-center text-gray-400">Загрузка...</div>
  if (ошибка) return <div className="card p-6 bg-red-50 text-red-600 text-sm">{ошибка}</div>
  if (!данные) return null

  const статусЦвет: Record<string, string> = {
    в_работе: 'bg-blue-500',
    черновик:  'bg-gray-400',
    закрыта:   'bg-green-500',
    отменена:  'bg-red-400',
  }
  const статусНазвание: Record<string, string> = {
    в_работе: 'В работе',
    черновик:  'Черновики',
    закрыта:   'Закрыты',
    отменена:  'Отменены',
  }

  const СОБЫТИЕ_ИКОНКА: Record<string, string> = {
    'документ.загружен': '📤',
    'документ.на_согласовании': '📋',
    'документ.архивирован': '📦',
    'виза.поставлена': '✍️',
    'маршрут.завершён': '✅',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Дашборд</h1>

      {/* Алерт: просроченные визы */}
      {данные.просрочено_виз > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🔴</span>
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">
              {данные.просрочено_виз} {данные.просрочено_виз === 1 ? 'просроченная виза' : 'просроченных визы'} требуют внимания
            </p>
            <p className="text-red-600 text-xs mt-0.5">
              Согласование задержано — нужна эскалация или напоминание ответственным.
            </p>
          </div>
          <Link
            href="/deals"
            className="shrink-0 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Открыть сделки →
          </Link>
        </div>
      )}

      {/* KPI-виджеты */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-3xl font-bold text-gray-900">{данные.всего_сделок}</div>
          <div className="text-sm text-gray-500 mt-0.5">Всего сделок</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-bold text-blue-600">{данные.активных_сделок}</div>
          <div className="text-sm text-gray-500 mt-0.5">Активных (в работе)</div>
        </div>
        <div className={`card p-5 ${данные.просрочено_виз > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <div className={`text-3xl font-bold ${данные.просрочено_виз > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {данные.просрочено_виз}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">Просроченных виз</div>
          {данные.просрочено_виз > 0 && (
            <div className="text-xs text-red-500 mt-1 font-medium">⚠️ Требуют внимания</div>
          )}
        </div>
      </div>

      {/* Сделки по статусам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Сделки по статусам</h2>
          <div className="space-y-3">
            {Object.entries(данные.сделки_по_статусам).map(([статус, кол]) => {
              const макс = Math.max(...Object.values(данные.сделки_по_статусам))
              const ширина = макс > 0 ? Math.round((кол / макс) * 100) : 0
              return (
                <div key={статус}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{статусНазвание[статус] ?? статус}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{кол}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${статусЦвет[статус] ?? 'bg-gray-400'}`}
                      style={{ width: `${ширина}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(данные.сделки_по_статусам).length === 0 && (
              <p className="text-sm text-gray-400">Нет данных</p>
            )}
          </div>
          <div className="mt-4">
            <Link href="/deals" className="text-sm text-indigo-600 hover:text-indigo-800">
              Все сделки →
            </Link>
          </div>
        </div>

        {/* Последние события */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Последние события</h2>
          <div className="space-y-2">
            {данные.последние_события.map(с => (
              <div key={с.id} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-base shrink-0 mt-0.5">
                  {СОБЫТИЕ_ИКОНКА[с.тип] ?? '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 truncate">
                    {с.тип.replace('.', ' → ')}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {форматДатыВремени(с.создано)}
                  </div>
                </div>
                <Link
                  href={`/${с.сущность_тип === 'виза' ? 'deals' : с.сущность_тип === 'документ' ? 'documents' : 'deals'}/${с.сущность_id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-600 shrink-0"
                >
                  →
                </Link>
              </div>
            ))}
            {данные.последние_события.length === 0 && (
              <p className="text-sm text-gray-400">Событий пока нет</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
