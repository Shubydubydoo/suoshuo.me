'use client'
import { useState, useRef, useCallback } from 'react'
import { trackEvent } from '@/lib/analytics'
import styles from './Analysis.module.css'
import { type AnalysisResult } from '@/lib/types'

interface AnalysisProps {
  result: AnalysisResult | null
  loading: boolean
  turns: number
  error: string
  scenario: string
  onBack: () => void
}

const KW_COLORS = [styles.ka, styles.kb, styles.kc, styles.kd, styles.ka]

export default function Analysis({ result, loading, turns, error, scenario, onBack }: AnalysisProps) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [sendError, setSendError] = useState('')
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function sendReport() {
    if (!email || !result) return
    setSending(true)
    setSendStatus('idle')
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, result, scenario }),
      })
      const data = await res.json()
      if (data.error) { setSendStatus('error'); setSendError(data.error) }
      else { setSendStatus('ok'); setEmail(''); trackEvent('email_report_sent') }
    } catch {
      setSendStatus('error')
      setSendError('網路錯誤，請稍後再試')
    } finally {
      setSending(false)
    }
  }

  const generateImage = useCallback(() => {
    if (!result || !canvasRef.current) return
    setGenerating(true)

    const canvas = canvasRef.current
    const W = 750
    const H = 1050
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // 背景漸層
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#FDF0EB')
    grad.addColorStop(0.5, '#F8E8F2')
    grad.addColorStop(1, '#F0EAFB')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 裝飾光暈
    const drawBlob = (x: number, y: number, r: number, color: string, alpha: number) => {
      ctx.save()
      ctx.globalAlpha = alpha
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, color)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    drawBlob(100, 120, 200, '#F5C4D8', 0.5)
    drawBlob(650, 200, 180, '#F9D9C8', 0.4)
    drawBlob(680, 900, 220, '#E8D0F0', 0.4)
    drawBlob(50, 900, 160, '#FAE4B8', 0.35)

    // 工具函式
    const wrapText = (text: string, x: number, y: number, maxW: number, lineH: number): number => {
      const chars = text.split('')
      let line = ''
      let curY = y
      for (const ch of chars) {
        const test = line + ch
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, x, curY)
          line = ch
          curY += lineH
        } else {
          line = test
        }
      }
      if (line) { ctx.fillText(line, x, curY); curY += lineH }
      return curY
    }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }

    // Logo 區
    ctx.save()
    const logoGrad = ctx.createLinearGradient(340, 48, 410, 110)
    logoGrad.addColorStop(0, '#E8826A')
    logoGrad.addColorStop(1, '#C95C8A')
    roundRect(340, 48, 70, 70, 20)
    ctx.fillStyle = logoGrad
    ctx.fill()
    ctx.font = 'bold 32px sans-serif'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.fillText('💬', 375, 96)
    ctx.restore()

    // 品牌名
    ctx.font = `bold 38px "Noto Serif TC", serif`
    ctx.fillStyle = '#2C1F1A'
    ctx.textAlign = 'center'
    ctx.fillText('說說', W / 2, 158)

    ctx.font = '18px "Noto Sans TC", sans-serif'
    ctx.fillStyle = '#C95C8A'
    ctx.fillText('你的聊天樣貌分析', W / 2, 186)

    // 情境標籤
    const tagText = `情境：${scenario}`
    const tagW = ctx.measureText(tagText).width + 32
    roundRect((W - tagW) / 2, 198, tagW, 30, 15)
    ctx.fillStyle = 'rgba(201,92,138,0.1)'
    ctx.fill()
    ctx.font = '14px "Noto Sans TC", sans-serif'
    ctx.fillStyle = '#C95C8A'
    ctx.fillText(tagText, W / 2, 218)

    // 分隔線
    ctx.strokeStyle = 'rgba(201,92,138,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, 238)
    ctx.lineTo(W - 60, 238)
    ctx.stroke()

    // 分析卡片
    const sections = [
      { label: '你是什麼樣的聊天對象', text: result.chat_type },
      { label: '你喜歡對方的互動方式', text: result.preferred_interaction },
      { label: '你喜歡對方的聊天風格', text: result.preferred_style },
      { label: '你通常如何應對對方', text: result.response_pattern },
    ]

    let y = 252
    for (const sec of sections) {
      // 估算文字高度
      ctx.font = '15px "Noto Sans TC", sans-serif'
      const lineH = 24
      const maxW = W - 160
      const chars = sec.text.split('')
      let line = ''
      let lines = 1
      for (const ch of chars) {
        const test = line + ch
        if (ctx.measureText(test).width > maxW && line) { lines++; line = ch }
        else line = test
      }
      const cardH = 20 + 22 + 8 + lines * lineH + 14

      roundRect(50, y, W - 100, cardH, 14)
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(232,130,106,0.18)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.font = 'bold 12px "Noto Sans TC", sans-serif'
      ctx.fillStyle = '#C8A090'
      ctx.textAlign = 'left'
      ctx.fillText(sec.label.toUpperCase(), 74, y + 20)

      ctx.font = '15px "Noto Sans TC", sans-serif'
      ctx.fillStyle = '#2C1F1A'
      wrapText(sec.text, 74, y + 42, maxW, lineH)

      y += cardH + 10
    }

    // 關鍵字標題
    ctx.font = 'bold 12px "Noto Sans TC", sans-serif'
    ctx.fillStyle = '#C8A090'
    ctx.textAlign = 'left'
    ctx.fillText('你想找的對象關鍵字', 74, y + 16)
    y += 28

    // 關鍵字標籤
    const kwColors = [
      { bg: 'rgba(251,234,240,0.9)', border: 'rgba(212,83,126,0.3)', text: '#993556' },
      { bg: 'rgba(230,241,251,0.9)', border: 'rgba(24,95,165,0.3)', text: '#185FA5' },
      { bg: 'rgba(250,238,218,0.9)', border: 'rgba(133,79,11,0.3)', text: '#854F0B' },
      { bg: 'rgba(234,243,222,0.9)', border: 'rgba(59,109,17,0.3)', text: '#3B6D11' },
      { bg: 'rgba(238,237,254,0.9)', border: 'rgba(83,74,183,0.3)', text: '#534AB7' },
    ]
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif'
    let kwX = 74
    const kwY = y
    for (let i = 0; i < result.keywords.length; i++) {
      const kw = result.keywords[i]
      const kwW = ctx.measureText(kw).width + 24
      const c = kwColors[i % kwColors.length]
      roundRect(kwX, kwY, kwW, 32, 16)
      ctx.fillStyle = c.bg
      ctx.fill()
      ctx.strokeStyle = c.border
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = c.text
      ctx.textAlign = 'center'
      ctx.fillText(kw, kwX + kwW / 2, kwY + 21)
      kwX += kwW + 8
      if (kwX > W - 100) { kwX = 74; y += 38 }
    }

    y = Math.max(y + 46, H - 80)

    // 底部
    ctx.strokeStyle = 'rgba(201,92,138,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, H - 66)
    ctx.lineTo(W - 60, H - 66)
    ctx.stroke()

    ctx.font = 'bold 16px "Noto Sans TC", sans-serif'
    ctx.fillStyle = '#C95C8A'
    ctx.textAlign = 'center'
    ctx.fillText('說說', W / 2, H - 42)

    ctx.font = '13px "Noto Sans TC", sans-serif'
    ctx.fillStyle = '#C8A090'
    ctx.fillText('suoshuome.vercel.app', W / 2, H - 22)

    const url = canvas.toDataURL('image/png')
    setImgUrl(url)
    setGenerating(false)
    trackEvent('analysis_completed', { turn_count: turns })
  }, [result, scenario, turns])

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <button className={styles.backBtn} onClick={onBack}>← 繼續聊</button>
        <h2 className={styles.title}>你的戀愛樣貌分析</h2>
      </div>

      <div className={styles.body}>
        {loading && <div className={styles.loading}>正在分析你的互動模式...</div>}
        {!loading && error && <div className={styles.warn}>{error}</div>}
        {!loading && turns < 3 && !error && (
          <div className={styles.warn}>你目前只有 {turns} 則對話，資料還不夠喔！建議再多聊幾句 ✦</div>
        )}

        {!loading && result && (
          <>
            {result.is_short && (
              <div className={styles.warn}>對話還不夠多，以下分析僅供參考，多聊幾句後會更準確 ✦</div>
            )}
            <Card label="你是什麼樣的聊天對象" text={result.chat_type} />
            <Card label="你喜歡對方怎麼跟你互動" text={result.preferred_interaction} />
            <Card label="你喜歡對方的聊天風格" text={result.preferred_style} />
            <Card label="你通常如何應對對方" text={result.response_pattern} />
            <div className={styles.card}>
              <div className={styles.cardLabel}>你想找的對象關鍵字</div>
              <div className={styles.kws}>
                {result.keywords.map((k, i) => (
                  <span key={i} className={`${styles.kw} ${KW_COLORS[i % KW_COLORS.length]}`}>{k}</span>
                ))}
              </div>
            </div>

            {/* 分享圖片區 */}
            <div className={styles.shareCard}>
              <div className={styles.shareTitle}>製作分享圖 ✦</div>
              <div className={styles.shareSub}>生成一張質感分析圖，分享到 IG 或 Line</div>

              {!imgUrl ? (
                <button
                  className={styles.genBtn}
                  onClick={generateImage}
                  disabled={generating}
                >
                  {generating ? '生成中...' : '生成分享圖'}
                </button>
              ) : (
                <div className={styles.imgWrap}>
                  <img src={imgUrl} alt="分析圖" className={styles.shareImg} />
                  <div className={styles.imgHint}>長按圖片儲存 / 右鍵另存新檔</div>
                  <button className={styles.regenBtn} onClick={() => setImgUrl(null)}>重新生成</button>
                </div>
              )}
            </div>

            {/* Email 寄送 */}
            <div className={styles.emailCard}>
              <div className={styles.emailTitle}>寄到信箱儲存</div>
              <div className={styles.emailRow}>
                <input
                  className={styles.emailInput}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => !e.nativeEvent.isComposing && e.key === 'Enter' && sendReport()}
                />
                <button className={styles.emailBtn} onClick={sendReport} disabled={sending || !email}>
                  {sending ? '寄送中...' : '寄出 ↗'}
                </button>
              </div>
              {sendStatus === 'ok' && <div className={styles.sendOk}>✓ 已寄出！請檢查你的信箱</div>}
              {sendStatus === 'error' && <div className={styles.sendErr}>{sendError}</div>}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        )}
      </div>
    </div>
  )
}

function Card({ label, text }: { label: string; text: string }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardText}>{text}</div>
    </div>
  )
}
