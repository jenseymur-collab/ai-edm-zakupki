// API-клиент: прямые запросы к backend на localhost:8000
// NEXT_PUBLIC_API_URL задаётся в docker-compose или дефолт localhost:8000

const BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')

async function запрос<T>(путь: string, опции?: RequestInit): Promise<T> {
  const ответ = await fetch(`${BASE}${путь}`, {
    headers: { 'Content-Type': 'application/json' },
    ...опции,
  })
  if (!ответ.ok) {
    const текст = await ответ.text()
    throw new Error(`${ответ.status}: ${текст}`)
  }
  return ответ.json()
}

// ── Типы ──────────────────────────────────────────────────────────────────────

export interface Сделка {
  id: string
  номер: string
  название: string
  профиль: string
  статус: string
  сумма: string | null
  валюта: string
  поставщик_id: string
  ответственный_id: string
  создана: string
  обновлена: string
  поставщик?: { название: string; инн: string }
  документов_всего?: number
  документов_на_согласовании?: number
  просрочено_виз?: number
}

export interface Документ {
  id: string
  сделка_id: string
  тип: string
  номер: string | null
  версия: number
  активная: boolean
  статус: string
  текст?: string
  источник?: string
  загружен_кем: string
  загружен_когда: string
  родитель_id?: string | null
  извлечённые_поля?: { поля: Record<string, unknown>; модель_использована: string } | null
  есть_эмбеддинг?: boolean
}

export interface Виза {
  id: string
  документ_id: string
  маршрут_id: string
  маршрут_статус: string
  шаг_статус: string
  пользователь_id: string | null
  решение: string | null
  комментарий: string | null
  дедлайн: string
  решено_когда: string | null
  просрочена: boolean
  роль_шага: string | null
  порядок_шага: number | null
}

export interface ЦепочкаСогласования {
  документ_id: string
  маршрут_название: string | null
  визы: Виза[]
  текущий_шаг: number | null
  завершено: boolean
}

export interface Дашборд {
  сделки_по_статусам: Record<string, number>
  просрочено_виз: number
  всего_сделок: number
  активных_сделок: number
  последние_события: Array<{
    id: string
    тип: string
    сущность_тип: string
    сущность_id: string
    создано: string | null
  }>
}

// ── Сделки ────────────────────────────────────────────────────────────────────

export const апи = {
  сделки: {
    список: (страница = 1) =>
      запрос<{ данные: Сделка[]; всего: number; страница: number; размер: number }>(
        `/deals?страница=${страница}&размер=50`
      ),
    карточка: (id: string) => запрос<Сделка>(`/deals/${id}`),
    документы: (id: string) => запрос<Документ[]>(`/deals/${id}/documents`),
    загрузитьДокумент: (id: string, тело: { тип: string; номер?: string; текст: string; загружен_кем: string }) =>
      запрос<Документ>(`/deals/${id}/documents`, {
        method: 'POST',
        body: JSON.stringify(тело),
      }),
  },

  документы: {
    карточка: (id: string) => запрос<Документ>(`/documents/${id}`),
    согласование: (id: string) => запрос<ЦепочкаСогласования>(`/documents/${id}/approvals`),
    виза: (id: string, тело: { пользователь_id: string; решение: string; комментарий?: string }) =>
      запрос(`/documents/${id}/approve`, { method: 'POST', body: JSON.stringify(тело) }),
  },

  дашборд: () => запрос<Дашборд>('/deals/dashboard'),

  ai: {
    извлечь: (id: string) => запрос<{ документ_id: string; поля: Record<string, unknown>; модель: string }>(`/ai/documents/${id}/extract`, { method: 'POST', body: '{}' }),
    поиск: (запрос_: string, топ = 5) =>
      запрос<{ результаты: Array<{ документ_id: string; тип: string; номер: string; статус: string; score: number; фрагмент: string; сделка_id: string }>; найдено: number }>(
        '/ai/search',
        { method: 'POST', body: JSON.stringify({ запрос: запрос_, топ }) }
      ),
    полнота: (id: string) =>
      запрос<{ полный: boolean; анализ: string; есть: string[]; отсутствуют: string[]; чеклист: string[] }>(
        `/ai/deals/${id}/completeness`
      ),
    задержки: (id: string) =>
      запрос<{ просрочено: number; под_угрозой: number; анализ: string }>(
        `/ai/deals/${id}/delays`
      ),
    сравнить: (id1: string, id2: string) =>
      запрос<{ анализ: string; версия_1: number; версия_2: number }>(
        '/ai/documents/compare',
        { method: 'POST', body: JSON.stringify({ документ_1_id: id1, документ_2_id: id2 }) }
      ),
  },
}
