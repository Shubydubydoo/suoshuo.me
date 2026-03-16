// 用戶行為追蹤工具
// 使用 Vercel Analytics 的自訂事件

type EventName =
  | 'chat_started'
  | 'message_sent'
  | 'analysis_triggered'
  | 'analysis_completed'
  | 'email_report_sent'
  | 'bmc_clicked'
  | 'session_reset'

interface EventProps {
  scenario?: string
  style?: string
  mode?: string
  turn_count?: number
  is_short?: boolean
}

export function trackEvent(name: EventName, props?: EventProps) {
  try {
    if (typeof window === 'undefined') return
    // Vercel Analytics 自訂事件
    if ((window as unknown as { va?: (cmd: string, name: string, props?: EventProps) => void }).va) {
      (window as unknown as { va: (cmd: string, name: string, props?: EventProps) => void }).va('event', name, props)
    }
  } catch {
    // 追蹤失敗不影響主功能
  }
}
