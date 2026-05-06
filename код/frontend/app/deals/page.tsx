'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { апи, type Сделка } from '@/lib/api'
import { СТАТУС_СДЕЛКИ, форматСуммы, форматДаты } from '@/lib/helpers'

export default function СписокСделок() {
  const [сделки, setSделки] = useState<Сделка[]>([])
  const [всего, setВсего] = useState(0)
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState<string | null>(null)

  useEffect(() => {
    апи.сделки.список()
      .then(r => { setSделки(r.данные); setВсего(r.всего) })
      .catch(e => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Сделки закупок</h1>
          {!загрузка && <p className="text-sm text-gray-500 mt-0.5">Всего: {всего}</p>}
        </div>
      </div>

      {загрузка && (
        <div className="card p-8 text-center text-gray-400">Загрузка...</div>
      )}

      {ошибка && (
        <div className="card p-6 bg-red-50 border-red-200">
          <p className="text-red-600 text-sm">{ошибка}</p>
        </div>
      )}

      {!загрузка && !ошибка && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Номер</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Название</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Профиль</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Сумма</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Создана</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {сделки.map(с => {
                const стат = СТАТУС_СДЕЛКИ[с.статус] ?? { label: с.статус, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={с.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/deals/${с.id}`} className="font-mono font-semibold text-indigo-600 hover:text-indigo-800">
                        {с.номер}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Link href={`/deals/${с.id}`} className="text-gray-900 hover:text-indigo-600 line-clamp-1">
                        {с.название}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-indigo-50 text-indigo-700">
                        {с.профиль === 'малая_закупка' ? 'Малая' : 'Стандарт'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${стат.cls}`}>{стат.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 tabular-nums">
                      {форматСуммы(с.сумма, с.валюта)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{форматДаты(с.создана)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {сделки.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Сделки не найдены
            </div>
          )}
        </div>
      )}
    </div>
  )
}
