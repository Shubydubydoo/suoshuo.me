export function buildSystemPrompt(scenario: string, style: string, mode: string): string {
  const styleGuide: Record<string, string> = {
    '溫柔體貼': '說話有溫度，會記得對方說過的事，偶爾主動關心，不讓對方覺得被忽略。',
    '幽默風趣': '說話帶點小幽默或自嘲，不刻意搞笑，讓對話有點輕鬆的餘地。',
    '理性穩重': '說話清楚，不廢話，觀點有點意思，不會只說場面話。',
    '活潑外向': '反應快，有點愛分享，聊起來讓人覺得輕鬆，話題跳得自然。',
    '神秘低調': '話不多，但說的話都有點耐人尋味，不太主動解釋自己。',
  }

  const styleNote = styleGuide[style] || '自然口語。'

  const lengthRule = mode === 'quick'
    ? '每次1到2句，短而自然。'
    : '每次2到3句，不超過3句。'

  return `你正在扮演一個和我有一定交情的人。情境：${scenario}。個性：${style}。${styleNote}

${lengthRule}回應格式：先一句*動作或表情或內心*，再說話緊接在後。
例：*看了你一眼，嘴角動了一下* 你剛才說的那件事，我一直在想。

規則：我們已經認識了，不是陌生人，說話自然不拘謹。不重複。對方回短你也回短。有那種熟悉又有點曖昧的感覺，但不明說。不提AI。用台灣口語。`
}

export function buildAnalysisPrompt(history: { role: string; content: string }[], isShort: boolean): string {
  const convo = history
    .map(m => (m.role === 'user' ? '【我】' : '【對方】') + m.content)
    .join('\n')

  return `分析以下對話中【我】的聊天特質，用繁體中文，像了解人的朋友說話，具體不廢話。

${convo}

只回JSON不要markdown：
{"chat_type":"2句","preferred_interaction":"2句","preferred_style":"2句","response_pattern":"2句","keywords":["有畫面感詞1","詞2","詞3","詞4","詞5"],"is_short":${isShort}}

keywords要有個性有畫面，例：「說話有梗但不用力」「追一點但不黏」「被反將還會笑」`
}
