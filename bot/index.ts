import 'dotenv/config'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Markup, Telegraf } from 'telegraf'

type Step = 'idle' | 'clientName' | 'clientPhone' | 'clientRequest' | 'clientSource' | 'clientComment'
type Report = { createdAt: string; administrator: string; clientName: string; phone: string; request: string; source: string; comment: string }
type Session = { chatId: number; userId: number; name: string; roleSelected: boolean; step: Step; lastReportAt: number; lastReminderAt: number; draft: Partial<Report> }

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN не указан в .env')

const inactivityThreshold = Number(process.env.INACTIVITY_THRESHOLD_MS ?? 60_000)
const reminderInterval = Number(process.env.REMINDER_INTERVAL_MS ?? 180_000)
const allowedAdmins = new Set((process.env.TELEGRAM_ADMIN_IDS ?? '').split(',').map((v) => Number(v.trim())).filter(Number.isFinite))
const bot = new Telegraf(token)
const sessions = new Map<number, Session>()
const reportsFile = path.resolve('data/client-reports.json')
const roleKeyboard = Markup.keyboard([['👩‍💼 Администратор']]).resize().oneTime()
const mainKeyboard = Markup.keyboard([['➕ Новый клиент'], ['📊 Мои отчёты сегодня']]).resize()

const allowed = (id: number) => allowedAdmins.size === 0 || allowedAdmins.has(id)
function sessionFor(ctx: { from?: { id: number; first_name: string; last_name?: string }; chat?: { id: number } }) {
  if (!ctx.from || !ctx.chat) return
  let session = sessions.get(ctx.from.id)
  if (!session) {
    session = { chatId: ctx.chat.id, userId: ctx.from.id, name: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' '), roleSelected: false, step: 'idle', lastReportAt: Date.now(), lastReminderAt: 0, draft: {} }
    sessions.set(ctx.from.id, session)
  }
  return session
}

async function readReports(): Promise<Report[]> {
  try { return JSON.parse(await readFile(reportsFile, 'utf8')) as Report[] } catch { return [] }
}
async function saveReport(report: Report) {
  await mkdir(path.dirname(reportsFile), { recursive: true })
  await writeFile(reportsFile, JSON.stringify([...(await readReports()), report], null, 2), 'utf8')
}

bot.start(async (ctx) => {
  if (!allowed(ctx.from.id)) return void await ctx.reply('У вас нет доступа к административному боту.')
  sessionFor(ctx)
  await ctx.reply('Добро пожаловать в BB Clinic. Выберите роль:', roleKeyboard)
})
bot.hears('👩‍💼 Администратор', async (ctx) => {
  if (!allowed(ctx.from.id)) return
  const session = sessionFor(ctx)!
  Object.assign(session, { roleSelected: true, lastReportAt: Date.now(), lastReminderAt: 0 })
  await ctx.reply('Роль активирована. После каждого обращения заполните карточку клиента.', mainKeyboard)
})
bot.hears('➕ Новый клиент', async (ctx) => {
  const session = sessionFor(ctx)
  if (!session?.roleSelected || !allowed(ctx.from.id)) return
  Object.assign(session, { step: 'clientName', draft: {} })
  await ctx.reply('Введите имя клиента:')
})
bot.hears('📊 Мои отчёты сегодня', async (ctx) => {
  const session = sessionFor(ctx)
  if (!session?.roleSelected || !allowed(ctx.from.id)) return
  const today = new Date().toISOString().slice(0, 10)
  const count = (await readReports()).filter((r) => r.createdAt.startsWith(today) && r.administrator === session.name).length
  await ctx.reply(`Сегодня отправлено карточек: ${count}`)
})
bot.on('text', async (ctx) => {
  const session = sessionFor(ctx)
  if (!session?.roleSelected || !allowed(ctx.from.id) || session.step === 'idle') return
  const value = ctx.message.text.trim()
  if (session.step === 'clientName') { session.draft.clientName = value; session.step = 'clientPhone'; return void await ctx.reply('Введите телефон клиента:') }
  if (session.step === 'clientPhone') { session.draft.phone = value; session.step = 'clientRequest'; return void await ctx.reply('Какой запрос или процедура интересует клиента?') }
  if (session.step === 'clientRequest') { session.draft.request = value; session.step = 'clientSource'; return void await ctx.reply('Источник: Instagram, WhatsApp, Telegram, рекомендация или другое?') }
  if (session.step === 'clientSource') { session.draft.source = value; session.step = 'clientComment'; return void await ctx.reply('Добавьте комментарий или отправьте «—»:') }
  const report: Report = { createdAt: new Date().toISOString(), administrator: session.name, clientName: session.draft.clientName ?? '', phone: session.draft.phone ?? '', request: session.draft.request ?? '', source: session.draft.source ?? '', comment: value === '—' ? '' : value }
  await saveReport(report)
  Object.assign(session, { step: 'idle', draft: {}, lastReportAt: Date.now(), lastReminderAt: 0 })
  await ctx.reply(`✅ Карточка клиента ${report.clientName} сохранена.`, mainKeyboard)
})

const reminderTimer = setInterval(async () => {
  const now = Date.now()
  for (const session of sessions.values()) {
    if (!session.roleSelected || now - session.lastReportAt < inactivityThreshold || (session.lastReminderAt && now - session.lastReminderAt < reminderInterval)) continue
    await bot.telegram.sendMessage(session.chatId, session.step === 'idle' ? '⏰ Более минуты нет нового отчёта. Если появилось обращение, заполните карточку клиента.' : '⏰ Карточка клиента не завершена. Продолжите заполнение.')
    session.lastReminderAt = now
  }
}, 10_000)

bot.launch().then(() => console.log('BB Clinic Telegram bot запущен'))
process.once('SIGINT', () => { clearInterval(reminderTimer); bot.stop('SIGINT') })
process.once('SIGTERM', () => { clearInterval(reminderTimer); bot.stop('SIGTERM') })
