// Утилиты форматирования

export function форматСуммы(сумма: string | number | null, валюта = 'RUB'): string {
  if (!сумма) return '—'
  const n = typeof сумма === 'string' ? parseFloat(сумма) : сумма
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: валюта, maximumFractionDigits: 0 }).format(n)
}

export function форматДаты(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function форматДатыВремени(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const СТАТУС_СДЕЛКИ: Record<string, { label: string; cls: string }> = {
  черновик:    { label: 'Черновик',    cls: 'bg-gray-100 text-gray-700' },
  в_работе:   { label: 'В работе',    cls: 'bg-blue-100 text-blue-700' },
  закрыта:    { label: 'Закрыта',     cls: 'bg-green-100 text-green-700' },
  отменена:   { label: 'Отменена',    cls: 'bg-red-100 text-red-700' },
}

export const СТАТУС_ДОКУМЕНТА: Record<string, { label: string; cls: string }> = {
  загружен:          { label: 'Загружен',         cls: 'bg-gray-100 text-gray-600' },
  на_согласовании:   { label: 'На согласовании',  cls: 'bg-yellow-100 text-yellow-700' },
  согласован:        { label: 'Согласован',        cls: 'bg-green-100 text-green-700' },
  отклонён:          { label: 'Отклонён',          cls: 'bg-red-100 text-red-700' },
  архив:             { label: 'Архив',             cls: 'bg-gray-100 text-gray-400' },
}

export const ТИП_ДОКУМЕНТА: Record<string, string> = {
  заявка_на_закупку:        'Заявка на закупку',
  коммерческое_предложение: 'Коммерческое предложение',
  протокол_выбора:          'Протокол выбора',
  договор:                  'Договор',
  спецификация:             'Спецификация',
  акт:                      'Акт приёмки',
  счёт_фактура:             'Счёт-фактура',
}

export const РОЛЬ_ШАГА: Record<string, string> = {
  закупки:  'Закупки',
  финансы:  'Финансы',
  юрист:    'Юрист',
  гд:       'Ген. директор',
  аудитор:  'Аудитор',
}

export const РЕШЕНИЕ_ВИЗЫ: Record<string, { label: string; cls: string }> = {
  согласовано:    { label: 'Согласовано',   cls: 'text-green-600' },
  отклонено:      { label: 'Отклонено',     cls: 'text-red-600' },
  на_доработку:   { label: 'На доработку',  cls: 'text-orange-500' },
}

export function статусВизы(виза: { решение: string | null; шаг_статус: string; просрочена: boolean }): { label: string; cls: string } {
  if (виза.решение === 'согласовано') return { label: '✅ Согласовано', cls: 'text-green-600' }
  if (виза.решение === 'отклонено')  return { label: '❌ Отклонено',   cls: 'text-red-600' }
  if (виза.просрочена)               return { label: '🔴 Просрочено',  cls: 'text-red-600 font-semibold' }
  if (виза.шаг_статус === 'активен') return { label: '⏳ Ожидает',     cls: 'text-yellow-600' }
  return { label: '🔜 В очереди', cls: 'text-gray-400' }
}
