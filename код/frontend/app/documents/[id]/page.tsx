'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { апи, type Документ } from '@/lib/api'
import { СТАТУС_ДОКУМЕНТА, ТИП_ДОКУМЕНТА, форматДатыВремени } from '@/lib/helpers'

export default function КарточкаДокумента() {
  const { id } = useParams<{ id: string }>()
  const [документ, setДокумент] = useState<Документ | null>(null)
  const [загрузка, setЗагрузка] = useState(true)
  const [извлечение, setИзвлечение] = useState(false)
  const [ошибка, setОшибка] = useState<string | null>(null)

  const загрузить = () => {
    setЗагрузка(true)
    апи.документы.карточка(id)
      .then(setДокумент)
      .catch(e => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }

  useEffect(() => { загрузить() }, [id])

  const извлечьПоля = async () => {
    setИзвлечение(true)
    try {
      await апи.ai.извлечь(id)
      загрузить()
    } catch (e: unknown) {
      alert(`Ошибка извлечения: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setИзвлечение(false)
    }
  }

  if (загрузка) return <div className="card p-8 text-center text-gray-400">Загрузка...</div>
  if (ошибка) return <div className="card p-6 bg-red-50 text-red-600 text-sm">{ошибка}</div>
  if (!документ) return null

  const ст = СТАТУС_ДОКУМЕНТА[документ.статус] ?? { label: документ.статус, cls: 'bg-gray-100 text-gray-600' }

  return (
    <div className="space-y-4">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/deals" className="hover:text-indigo-600">Сделки</Link>
        <span>/</span>
        <Link href={`/deals/${документ.сделка_id}`} className="hover:text-indigo-600">Сделка</Link>
        <span>/</span>
        <span className="text-gray-700">{ТИП_ДОКУМЕНТА[документ.тип] ?? документ.тип}</span>
      </div>

      {/* Шапка */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-medium text-gray-700">
                {ТИП_ДОКУМЕНТА[документ.тип] ?? документ.тип}
              </span>
              <span className={`badge ${ст.cls}`}>{ст.label}</span>
              <span className="badge bg-gray-100 text-gray-500">v{документ.версия}</span>
              {!документ.активная && (
                <span className="badge bg-yellow-100 text-yellow-700">Архив</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {документ.номер ?? 'Без номера'}
            </h1>
            <div className="text-sm text-gray-500 mt-1">
              Загружен: {форматДатыВремени(документ.загружен_когда)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {документ.есть_эмбеддинг && (
              <span className="badge bg-purple-50 text-purple-600">🔍 Проиндексирован</span>
            )}
            <button
              onClick={извлечьПоля}
              disabled={извлечение}
              className="btn-secondary"
            >
              {извлечение ? '⏳ Извлекаю...' : '🤖 Извлечь поля AI'}
            </button>
          </div>
        </div>
      </div>

      {/* AI-поля */}
      {документ.извлечённые_поля && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            🤖 Извлечённые поля
            <span className="ml-2 text-xs font-normal text-gray-400">
              · {документ.извлечённые_поля.модель_использована}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(документ.извлечённые_поля.поля).map(([ключ, значение]) => (
              значение != null && (
                <div key={ключ} className="flex gap-2 text-sm">
                  <span className="text-gray-500 min-w-[120px] shrink-0">{ключ}:</span>
                  <span className="text-gray-900 font-medium">{String(значение)}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Текст документа */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">📄 Текст документа</h2>
        <pre className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap border border-gray-100 font-sans leading-relaxed">
          {документ.текст}
        </pre>
      </div>
    </div>
  )
}
