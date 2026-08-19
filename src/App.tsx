import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gauge,
  LayoutDashboard,
  Menu,
  PackageOpen,
  Plus,
  Search,
  Settings,
  Stethoscope,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'

type TaskStatus = 'В работе' | 'Готово к процедуре' | 'Ожидает ресурсы'

const navItems = [
  { label: 'Центр управления', icon: LayoutDashboard, active: true },
  { label: 'Задания', icon: CalendarDays, count: 8 },
  { label: 'Персонал', icon: UsersRound },
  { label: 'Кабинеты', icon: Stethoscope },
  { label: 'Оборудование', icon: Gauge },
  { label: 'Услуги и процессы', icon: Boxes },
  { label: 'Склад', icon: PackageOpen, count: 3 },
]

const tasks: Array<{
  time: string
  service: string
  doctor: string
  room: string
  status: TaskStatus
}> = [
  { time: '10:00', service: 'RF-лифтинг EndyMed', doctor: 'А. Сарсенова', room: 'Кабинет 3', status: 'Готово к процедуре' },
  { time: '11:30', service: 'Фототерапия M22', doctor: 'М. Касымова', room: 'Кабинет 2', status: 'В работе' },
  { time: '14:00', service: 'Биоревитализация', doctor: 'А. Сарсенова', room: 'Кабинет 1', status: 'Ожидает ресурсы' },
  { time: '16:30', service: 'Диагностика Antera 3D', doctor: 'Д. Алиева', room: 'Диагностика', status: 'Готово к процедуре' },
]

const stockAlerts = [
  { name: 'Juvederm Volift 1 мл', detail: 'Осталось 2 шт. · минимум 5', tone: 'critical' },
  { name: 'Микроигольчатая насадка', detail: 'Осталось 4 шт. · минимум 8', tone: 'warning' },
  { name: 'Антисептик 1 л', detail: 'Срок годности через 12 дней', tone: 'warning' },
]

function StatCard({
  title,
  value,
  note,
  trend,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  note: string
  trend?: 'up' | 'down'
  icon: typeof Gauge
  accent: string
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-title">{title}</span>
        <span className="stat-icon" style={{ background: accent }}><Icon size={18} /></span>
      </div>
      <strong className="stat-value">{value}</strong>
      <div className={`stat-note ${trend ?? ''}`}>
        {trend === 'up' && <ArrowUpRight size={14} />}
        {trend === 'down' && <ArrowDownRight size={14} />}
        {note}
      </div>
    </article>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState(false)

  const filteredTasks = tasks.filter((task) =>
    `${task.service} ${task.doctor} ${task.room}`.toLowerCase().includes(query.toLowerCase()),
  )

  const createTask = () => {
    setToast(true)
    window.setTimeout(() => setToast(false), 2800)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">BB</div>
          <div><strong>BB Clinic</strong><span>Алматы · Управление</span></div>
          <button className="icon-button close-menu" onClick={() => setSidebarOpen(false)} aria-label="Закрыть меню"><X size={20} /></button>
        </div>

        <nav className="nav-list" aria-label="Основная навигация">
          <p className="nav-label">Рабочее пространство</p>
          {navItems.map(({ label, icon: Icon, count, active }) => (
            <button className={`nav-item ${active ? 'active' : ''}`} key={label}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {count && <em>{count}</em>}
            </button>
          ))}
          <p className="nav-label lower">Система</p>
          <button className="nav-item"><CircleDollarSign size={19} /><span>Финансы</span></button>
          <button className="nav-item"><Settings size={19} /><span>Настройки</span></button>
        </nav>

        <div className="clinic-health">
          <div><span className="pulse-dot" />Система работает</div>
          <p>Последняя синхронизация<br />сегодня, 09:42</p>
        </div>
      </aside>
      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Закрыть меню" />}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Открыть меню"><Menu size={22} /></button>
          <div className="search-wrap">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по заданиям, врачам, ресурсам..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="branch-picker">BB Clinic Алматы <ChevronDown size={16} /></button>
          <div className="profile"><span>АК</span><div><strong>Акылбек</strong><small>Управляющий</small></div></div>
        </header>

        <div className="page">
          <section className="page-heading">
            <div>
              <span className="eyebrow">СРЕДА, 19 АВГУСТА</span>
              <h1>Центр управления</h1>
              <p>Вся клиника — от ресурсов до финансового результата.</p>
            </div>
            <button className="primary-button" onClick={createTask}><Plus size={18} /> Создать задание</button>
          </section>

          <section className="stats-grid">
            <StatCard title="Загрузка клиники" value="76%" note="на 8% выше недели" trend="up" icon={Gauge} accent="#ddebe2" />
            <StatCard title="Задания сегодня" value="18" note="12 завершено · 2 риска" icon={CalendarDays} accent="#e5e5f3" />
            <StatCard title="Маржинальный доход" value="842 500 ₸" note="на 12,4% выше плана" trend="up" icon={CircleDollarSign} accent="#f0e8d6" />
            <StatCard title="Требуют внимания" value="5" note="3 склад · 2 оборудование" trend="down" icon={AlertTriangle} accent="#f4dfda" />
          </section>

          <section className="workflow-card">
            <div className="section-heading">
              <div><span className="eyebrow">ЖИВОЙ КОНВЕЙЕР</span><h2>Статус процессов</h2></div>
              <button className="text-button">Все задания <ChevronRight size={16} /></button>
            </div>
            <div className="workflow-track">
              {[
                ['Запланировано', '6', '100%'],
                ['Ресурсы подтверждены', '5', '84%'],
                ['Материалы готовы', '4', '67%'],
                ['Выполняется', '2', '34%'],
                ['Закрыто', '12', '100%'],
              ].map(([label, value, width], index) => (
                <div className="workflow-step" key={label}>
                  <div className="step-number">{value}</div>
                  <div className="step-copy"><strong>{label}</strong><span>{index === 4 ? 'за сегодня' : 'активных заданий'}</span></div>
                  <div className="step-line"><i style={{ width }} /></div>
                </div>
              ))}
            </div>
          </section>

          <div className="content-grid">
            <section className="panel schedule-panel">
              <div className="section-heading compact">
                <div><span className="eyebrow">СЕГОДНЯ</span><h2>Ближайшие задания</h2></div>
                <button className="text-button">Расписание <ChevronRight size={16} /></button>
              </div>
              <div className="task-list">
                {filteredTasks.length ? filteredTasks.map((task) => (
                  <article className="task-row" key={`${task.time}-${task.service}`}>
                    <time>{task.time}</time>
                    <span className="time-line" />
                    <div className="task-main"><strong>{task.service}</strong><span>{task.doctor} · {task.room}</span></div>
                    <span className={`status ${task.status === 'В работе' ? 'working' : task.status === 'Ожидает ресурсы' ? 'risk' : 'ready'}`}>{task.status}</span>
                    <button className="icon-button"><ChevronRight size={18} /></button>
                  </article>
                )) : <div className="empty-state">По вашему запросу ничего не найдено</div>}
              </div>
            </section>

            <section className="panel alerts-panel">
              <div className="section-heading compact">
                <div><span className="eyebrow">КОНТРОЛЬ</span><h2>Требует внимания</h2></div>
                <span className="alert-count">3</span>
              </div>
              <div className="alert-list">
                {stockAlerts.map((alert) => (
                  <article className="alert-row" key={alert.name}>
                    <span className={`alert-icon ${alert.tone}`}><AlertTriangle size={17} /></span>
                    <div><strong>{alert.name}</strong><span>{alert.detail}</span></div>
                    <ChevronRight size={17} />
                  </article>
                ))}
              </div>
              <button className="secondary-button"><PackageOpen size={17} /> Открыть склад</button>
            </section>
          </div>

          <section className="resource-strip">
            <div className="resource-title"><Wrench size={18} /><div><strong>Состояние ресурсов</strong><span>На текущий момент</span></div></div>
            <div className="resource-metric"><strong>7 / 8</strong><span>врачей в графике</span></div>
            <div className="resource-metric"><strong>5 / 6</strong><span>кабинетов доступны</span></div>
            <div className="resource-metric"><strong>9 / 11</strong><span>аппаратов исправны</span></div>
            <div className="resource-metric"><strong><Clock3 size={17} /> 2</strong><span>обслуживания сегодня</span></div>
          </section>
        </div>
      </main>

      {toast && <div className="toast"><span>✓</span> Черновик задания создан</div>}
    </div>
  )
}

export default App
