'use client'

import { useState } from 'react'
import Link from 'next/link'
import { апи } from '@/lib/api'
import { ТИП_ДОКУМЕНТА, СТАТУС_ДОКУМЕНТА } from '@/lib/helpers'

interface Результат {
  документ_id: string
  сделка_id: string
  тип: string
  номер: string
  статус: string
  score: number
  фрагмент: string
}

export default function СтраницаПоиска() {
  const [запрос, setЗапрос] = useState('')
  const [результаты, setРезультаты] = useState<Результат[]>([])
  const [загрузка, setЗагрузка] = useState(false)
  const [выполнен, setВыполнен] = useState(false)
  const [ошибка, setОшибка] = useState<string | null>(null)

  const поиск = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!запрос.trim()) return
    setЗагрузка(true)
    setОшибка(null)
    setВыполнен(false)
    try {
      const r = await апи.ai.поиск(запрос.trim())
      setРезультаты(r.результаты)
      setВыполнен(true)
    } catch (e: unknown) {
      setОшибка(`Ошибка поиска: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setЗагрузка(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🔍 Семантический поиск</h1>

      <form onSubmit={поиск} className="flex gap-3 mb-6">
        <input
          type="text"
          value={запрос}
          onChange={e => setЗапрос(e.target.value)}
          placeholder="Например: амоксициллин поставка, реактивы QC, условия оплаты..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={загрузка}
        />
        <button
          type="submit"
          disabled={загрузка || !запрос.trim()}
          className="btn-primary px-6"
        >
          {загрузка ? '⏳ Ищу...' : 'Найти'}
        </button>
      </form>

      {ошибка && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-600 text-sm mb-4">{ошибка}</div>
      )}

      {выполнен && результаты.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          Ничего не найдено. Попробуйте другой запрос.
        </div>
      )}

      {результаты.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Найдено: {результаты.length} документа</p>
          {результаты.map(р => {
            const ст = СТАТУС_ДОКУМЕНТА[р.статус] ?? { label: р.статус, cls: 'bg-gray-100 text-gray-600' }
            const схожесть = Math.round(р.score * 100)
            return (
              <div key={р.документ_id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {ТИП_ДОКУМЕНТА[р.тип] ?? р.тип}
                    </span>
                    {р.номер && (
                      <span className="font-mono text-sm text-gray-500">№{р.номер}</span>
                    )}
                    <span className={`badge ${ст.cls}`}>{ст.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${схожесть > 80 ? 'bg-green-500' : схожесть > 60 ? 'bg-yellow-500' : 'bg-orange-400'}`}
                          style={{ width: `${схожесть}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{схожесть}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
                  {р.фрагмент}
                </p>
                <div className="flex items-center gap-3">
                  <Link href={`/documents/${р.документ_id}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                    Открыть документ →
                  </Link>
                  <Link href={`/deals/${р.сделка_id}`} className="text-sm text-gray-400 hover:text-gray-600">
                    К сделке
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!выполнен && !загрузка && (
        <div className="card p-6 bg-indigo-50 border-indigo-100">
          <p className="text-sm text-indigo-700 font-medium mb-2">Как работает поиск</p>
          <p className="text-sm text-indigo-600">
            Используется семантический поиск через векторную базу (pgvector).
            Система понимает смысл запроса, а не только ключевые слова.
            Проиндексированы: договоры и заявки из демо-данных.
          </p>
        </div>
      )}
    </div>
  )
}
