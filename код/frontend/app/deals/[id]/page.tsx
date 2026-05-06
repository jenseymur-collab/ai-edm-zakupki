'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { апи, type Сделка, type Документ, type ЦепочкаСогласования } from '@/lib/api'
import {
  СТАТУС_СДЕЛКИ, СТАТУС_ДОКУМЕНТА, ТИП_ДОКУМЕНТА, РОЛЬ_ШАГА,
  форматСуммы, форматДаты, форматДатыВремени, статусВизы,
} from '@/lib/helpers'

type Вкладка = 'документы' | 'согласование' | 'ai'

const ТИПЫ_ДОКУМЕНТОВ_СПИСОК = [
  { value: 'заявка_на_закупку',       label: 'Заявка на закупку' },
  { value: 'коммерческое_предложение', label: 'Коммерческое предложение' },
  { value: 'протокол_выбора',          label: 'Протокол выбора поставщика' },
  { value: 'договор',                  label: 'Договор поставки' },
  { value: 'спецификация',             label: 'Спецификация' },
  { value: 'акт',                      label: 'Акт приёмки-передачи' },
  { value: 'счёт_фактура',             label: 'Счёт-фактура' },
]

export default function КарточкаСделки() {
  const { id } = useParams<{ id: string }>()
  const [сделка, setSделка] = useState<Сделка | null>(null)
  const [документы, setДокументы] = useState<Документ[]>([])
  const [загрузка, setЗагрузка] = useState(true)
  const [вкладка, setВкладка] = useState<Вкладка>('документы')
  const [ошибка, setОшибка] = useState<string | null>(null)

  const обновить = useCallback(() => {
    return Promise.all([апи.сделки.карточка(id), апи.сделки.документы(id)])
      .then(([с, д]) => { setSделка(с); setДокументы(д) })
      .catch(e => setОшибка(e.message))
  }, [id])

  useEffect(() => {
    обновить().finally(() => setЗагрузка(false))
  }, [обновить])

  if (загрузка) return <div className="card p-8 text-center text-gray-400">Загрузка...</div>
  if (ошибка) return <div className="card p-6 bg-red-50 text-red-600 text-sm">{ошибка}</div>
  if (!сделка) return null

  const стат = СТАТУС_СДЕЛКИ[сделка.статус] ?? { label: сделка.статус, cls: 'bg-gray-100 text-gray-600' }

  return (
    <div className="space-y-5">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/deals" className="hover:text-indigo-600">Сделки</Link>
        <span>/</span>
        <span className="font-mono text-gray-700">{сделка.номер}</span>
      </div>

      {/* Шапка */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm font-bold text-indigo-600">{сделка.номер}</span>
              <span className={`badge ${стат.cls}`}>{стат.label}</span>
              {(сделка.просрочено_виз ?? 0) > 0 && (
                <span className="badge bg-red-100 text-red-700">
                  🔴 {сделка.просрочено_виз} просрочена
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{сделка.название}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {сделка.поставщик && (
                <span>🏭 {сделка.поставщик.название} (ИНН {сделка.поставщик.инн})</span>
              )}
              <span>📄 Документов: {сделка.документов_всего ?? документы.length}</span>
              <span>📅 Создана: {форматДаты(сделка.создана)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {форматСуммы(сделка.сумма, сделка.валюта)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {сделка.профиль === 'малая_закупка' ? 'Малая закупка' : 'Стандартная закупка'}
            </div>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['документы', 'согласование', 'ai'] as Вкладка[]).map(в => (
            <button
              key={в}
              onClick={() => setВкладка(в)}
              className={`pb-3 text-sm ${вкладка === в ? 'tab-active' : 'tab-inactive'}`}
            >
              {в === 'документы' && '📄 Документы'}
              {в === 'согласование' && '✍️ Согласование'}
              {в === 'ai' && '🤖 AI-анализ'}
            </button>
          ))}
        </div>
      </div>

      {/* Контент вкладок */}
      {вкладка === 'документы' && (
        <ВкладкаДокументов
          документы={документы}
          сделкаId={id}
          userId={сделка.ответственный_id}
          onUploaded={обновить}
        />
      )}
      {вкладка === 'согласование' && (
        <ВкладкаСогласования документы={документы} userId={сделка.ответственный_id} />
      )}
      {вкладка === 'ai' && (
        <ВкладкаAI сделкаId={id} документы={документы} />
      )}
    </div>
  )
}

// ── Вкладка Документы ─────────────────────────────────────────────────────────

function ВкладкаДокументов({
  документы,
  сделкаId,
  userId,
  onUploaded,
}: {
  документы: Документ[]
  сделкаId: string
  userId: string
  onUploaded: () => Promise<void>
}) {
  const активные = документы.filter(д => д.активная)
  const архивные = документы.filter(д => !д.активная)
  const [показатьФорму, setПоказатьФорму] = useState(false)
  const [тип, setТип] = useState(ТИПЫ_ДОКУМЕНТОВ_СПИСОК[0].value)
  const [номер, setНомер] = useState('')
  const [текст, setТекст] = useState('')
  const [отправка, setОтправка] = useState(false)
  const [успех, setУспех] = useState<string | null>(null)
  const [ошибка, setОшибка] = useState<string | null>(null)

  const загрузить = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!текст.trim()) return
    setОтправка(true)
    setОшибка(null)
    setУспех(null)
    try {
      await апи.сделки.загрузитьДокумент(сделкаId, {
        тип,
        номер: номер.trim() || undefined,
        текст: текст.trim(),
        загружен_кем: userId,
      })
      setУспех('Документ загружен. Эмбеддинг создаётся в фоне.')
      setПоказатьФорму(false)
      setНомер('')
      setТекст('')
      setТип(ТИПЫ_ДОКУМЕНТОВ_СПИСОК[0].value)
      await onUploaded()
    } catch (e: unknown) {
      setОшибка(`Ошибка: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setОтправка(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Успех */}
      {успех && (
        <div className="card p-3 bg-green-50 border-green-200 text-green-700 text-sm flex items-center justify-between">
          ✅ {успех}
          <button onClick={() => setУспех(null)} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Кнопка открытия формы */}
      <div className="flex justify-end">
        <button
          onClick={() => { setПоказатьФорму(п => !п); setОшибка(null) }}
          className={`btn-primary text-sm ${показатьФорму ? 'opacity-60' : ''}`}
        >
          {показатьФорму ? '✕ Отмена' : '➕ Загрузить документ'}
        </button>
      </div>

      {/* Форма загрузки */}
      {показатьФорму && (
        <form onSubmit={загрузить} className="card p-5 border-indigo-200 bg-indigo-50 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Новый документ</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Тип документа *</label>
              <select
                value={тип}
                onChange={e => setТип(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ТИПЫ_ДОКУМЕНТОВ_СПИСОК.map(т => (
                  <option key={т.value} value={т.value}>{т.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Номер документа</label>
              <input
                type="text"
                value={номер}
                onChange={e => setНомер(e.target.value)}
                placeholder="Например: ДП-2026-099"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Текст документа * <span className="text-gray-400 font-normal">(вставьте содержимое)</span>
            </label>
            <textarea
              value={текст}
              onChange={e => setТекст(e.target.value)}
              rows={6}
              placeholder="Вставьте текст документа..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono"
              required
            />
          </div>

          {ошибка && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{ошибка}</div>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={отправка || !текст.trim()}
              className="btn-primary"
            >
              {отправка ? '⏳ Загружаю...' : '📤 Загрузить'}
            </button>
            <button
              type="button"
              onClick={() => setПоказатьФорму(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Таблица активных документов */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Активные документы</span>
          <span className="badge bg-gray-100 text-gray-600">{активные.length}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50 text-left">
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Тип</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Номер</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Версия</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Статус</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Загружен</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {активные.map(д => {
              const ст = СТАТУС_ДОКУМЕНТА[д.статус] ?? { label: д.статус, cls: 'bg-gray-100 text-gray-600' }
              return (
                <tr key={д.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    {ТИП_ДОКУМЕНТА[д.тип] ?? д.тип}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-600">{д.номер ?? '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="badge bg-gray-100 text-gray-600">v{д.версия}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${ст.cls}`}>{ст.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{форматДаты(д.загружен_когда)}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/documents/${д.id}`} className="text-indigo-500 hover:text-indigo-700 text-xs">
                      Открыть →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {архивные.length > 0 && (
        <details className="card overflow-hidden">
          <summary className="px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-50 select-none">
            Архивные версии ({архивные.length})
          </summary>
          <div className="border-t border-gray-100">
            {архивные.map(д => (
              <div key={д.id} className="px-4 py-2.5 flex items-center gap-4 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                <span>{ТИП_ДОКУМЕНТА[д.тип] ?? д.тип}</span>
                <span className="font-mono">{д.номер}</span>
                <span className="badge bg-gray-100 text-gray-400">v{д.версия}</span>
                <span className="badge bg-gray-100 text-gray-400">Архив</span>
                <Link href={`/documents/${д.id}`} className="ml-auto text-xs text-indigo-400 hover:text-indigo-600">
                  Открыть →
                </Link>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ── Вкладка Согласование ──────────────────────────────────────────────────────

function ВкладкаСогласования({ документы, userId }: { документы: Документ[]; userId: string }) {
  const договоры = документы.filter(д => д.тип === 'договор' && д.активная)

  if (договоры.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-400">
        Договор ещё не загружен
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {договоры.map(д => (
        <ЦепочкаВиз key={д.id} документ={д} userId={userId} />
      ))}
    </div>
  )
}

function ЦепочкаВиз({ документ, userId }: { документ: Документ; userId: string }) {
  const [цепочка, setCepochka] = useState<ЦепочкаСогласования | null>(null)
  const [загрузка, setЗагрузка] = useState(true)
  const [визируем, setВизируем] = useState<string | null>(null) // 'согласовано' | 'отклонено'
  const [комментарий, setКомментарий] = useState('')
  const [отправка, setОтправка] = useState(false)
  const [сообщение, setСообщение] = useState<string | null>(null)

  const загрузитьЦепочку = useCallback(() => {
    setЗагрузка(true)
    апи.документы.согласование(документ.id)
      .then(setCepochka)
      .catch(() => {})
      .finally(() => setЗагрузка(false))
  }, [документ.id])

  useEffect(() => { загрузитьЦепочку() }, [загрузитьЦепочку])

  const поставитьВизу = async () => {
    if (!визируем) return
    setОтправка(true)
    try {
      const r = await апи.документы.виза(документ.id, {
        пользователь_id: userId,
        решение: визируем,
        комментарий: комментарий.trim() || undefined,
      }) as { сообщение?: string }
      setСообщение(r?.сообщение ?? 'Виза поставлена')
      setВизируем(null)
      setКомментарий('')
      загрузитьЦепочку()
    } catch (e: unknown) {
      setСообщение(`Ошибка: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setОтправка(false)
    }
  }

  if (загрузка) return <div className="card p-4 text-gray-400 text-sm">Загрузка цепочки...</div>
  if (!цепочка || цепочка.визы.length === 0) {
    return <div className="card p-4 text-gray-400 text-sm">Цепочка согласования не найдена</div>
  }

  const активнаяВиза = цепочка.визы.find(в => в.шаг_статус === 'активен')
  const можноВизировать = !!активнаяВиза && !цепочка.завершено

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-700">
            {ТИП_ДОКУМЕНТА[документ.тип] ?? документ.тип} — {документ.номер}
          </span>
          {цепочка.маршрут_название && (
            <span className="ml-2 text-xs text-gray-400">· {цепочка.маршрут_название}</span>
          )}
        </div>
        {цепочка.завершено
          ? <span className="badge bg-green-100 text-green-700">✅ Завершено</span>
          : <span className="badge bg-yellow-100 text-yellow-700">⏳ В работе</span>
        }
      </div>

      {/* Цепочка шагов */}
      <div className="p-4">
        <div className="flex items-start gap-0">
          {цепочка.визы.map((виза, i) => {
            const ст = статусВизы(виза)
            const активна = виза.шаг_статус === 'активен'
            return (
              <div key={виза.id} className="flex items-start flex-1">
                <div className={`flex-1 ${i > 0 ? 'pl-4 border-l-2 ' + (активна ? 'border-indigo-300' : 'border-gray-200') : ''}`}>
                  <div className={`p-3 rounded-lg border ${активна ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600">
                        Шаг {виза.порядок_шага} · {РОЛЬ_ШАГА[виза.роль_шага ?? ''] ?? виза.роль_шага}
                      </span>
                      <span className={`text-xs ${ст.cls}`}>{ст.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Дедлайн: {форматДаты(виза.дедлайн)}
                    </div>
                    {виза.комментарий && (
                      <div className="mt-1 text-xs text-gray-600 italic">«{виза.комментарий}»</div>
                    )}
                    {виза.решено_когда && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Решено: {форматДатыВремени(виза.решено_когда)}
                      </div>
                    )}
                  </div>
                </div>
                {i < цепочка.визы.length - 1 && (
                  <div className="flex items-center mt-4 px-1 text-gray-300 text-lg">→</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Кнопки визирования */}
      {можноВизировать && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 mb-3">
            Шаг {активнаяВиза?.порядок_шага} · {РОЛЬ_ШАГА[активнаяВиза?.роль_шага ?? ''] ?? активнаяВиза?.роль_шага} · дедлайн {форматДаты(активнаяВиза?.дедлайн ?? '')}
          </p>

          {/* Уведомление результата */}
          {сообщение && (
            <div className={`text-sm rounded p-2 mb-3 ${сообщение.startsWith('Ошибка') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {сообщение}
            </div>
          )}

          {/* Выбор решения */}
          {!визируем ? (
            <div className="flex gap-2">
              <button
                onClick={() => setВизируем('согласовано')}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Принять
              </button>
              <button
                onClick={() => setВизируем('отклонено')}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ❌ Отклонить
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`text-sm font-medium ${визируем === 'согласовано' ? 'text-green-700' : 'text-red-700'}`}>
                {визируем === 'согласовано' ? '✅ Принять документ' : '❌ Отклонить документ'}
              </div>
              <textarea
                value={комментарий}
                onChange={e => setКомментарий(e.target.value)}
                placeholder="Комментарий (необязательно)..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={поставитьВизу}
                  disabled={отправка}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    визируем === 'согласовано'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {отправка ? '⏳...' : 'Подтвердить'}
                </button>
                <button
                  onClick={() => { setВизируем(null); setКомментарий('') }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Вкладка AI ────────────────────────────────────────────────────────────────

function ВкладкаAI({ сделкаId, документы }: { сделкаId: string; документы: Документ[] }) {
  const [полнота, setПолнота] = useState<string | null>(null)
  const [задержки, setЗадержки] = useState<string | null>(null)
  const [сравнение, setSравнение] = useState<string | null>(null)
  const [загрузкаПолнота, setЗагрузкаПолнота] = useState(false)
  const [загрузкаЗадержки, setЗагрузкаЗадержки] = useState(false)
  const [загрузкаСравнение, setЗагрузкаСравнение] = useState(false)

  const проверитьПолноту = async () => {
    setЗагрузкаПолнота(true); setПолнота(null)
    try {
      const r = await апи.ai.полнота(сделкаId)
      setПолнота(r.анализ)
    } catch (e: unknown) {
      setПолнота(`Ошибка: ${e instanceof Error ? e.message : String(e)}`)
    } finally { setЗагрузкаПолнота(false) }
  }

  const найтиЗадержки = async () => {
    setЗагрузкаЗадержки(true); setЗадержки(null)
    try {
      const r = await апи.ai.задержки(сделкаId)
      setЗадержки(r.анализ)
    } catch (e: unknown) {
      setЗадержки(`Ошибка: ${e instanceof Error ? e.message : String(e)}`)
    } finally { setЗагрузкаЗадержки(false) }
  }

  const версииДоговора = документы
    .filter(д => д.тип === 'договор')
    .sort((a, b) => a.версия - b.версия)

  const сравнитьВерсии = async () => {
    if (версииДоговора.length < 2) return
    setЗагрузкаСравнение(true); setSравнение(null)
    try {
      const r = await апи.ai.сравнить(версииДоговора[0].id, версииДоговора[1].id)
      setSравнение(r.анализ)
    } catch (e: unknown) {
      setSравнение(`Ошибка: ${e instanceof Error ? e.message : String(e)}`)
    } finally { setЗагрузкаСравнение(false) }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">📋 Полнота пакета документов</h3>
            <p className="text-sm text-gray-500 mt-0.5">AI проверяет наличие всех обязательных документов</p>
          </div>
          <button onClick={проверитьПолноту} disabled={загрузкаПолнота} className="btn-primary">
            {загрузкаПолнота ? '⏳ Анализ...' : 'Проверить'}
          </button>
        </div>
        {полнота && (
          <pre className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap border border-gray-100 font-sans">
            {полнота}
          </pre>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">⚠️ Задержки и риски согласования</h3>
            <p className="text-sm text-gray-500 mt-0.5">AI анализирует просроченные визы и эскалации</p>
          </div>
          <button onClick={найтиЗадержки} disabled={загрузкаЗадержки} className="btn-primary">
            {загрузкаЗадержки ? '⏳ Анализ...' : 'Найти задержки'}
          </button>
        </div>
        {задержки && (
          <pre className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap border border-gray-100 font-sans">
            {задержки}
          </pre>
        )}
      </div>

      {версииДоговора.length >= 2 && (
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">🔍 Сравнение версий договора</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                AI сравнивает v{версииДоговора[0].версия} и v{версииДоговора[1].версия} — изменения и риски
              </p>
            </div>
            <button onClick={сравнитьВерсии} disabled={загрузкаСравнение} className="btn-primary">
              {загрузкаСравнение ? '⏳ Сравниваю...' : 'Сравнить'}
            </button>
          </div>
          {сравнение && (
            <pre className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap border border-gray-100 font-sans">
              {сравнение}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
