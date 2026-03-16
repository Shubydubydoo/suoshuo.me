export function buildSystemPrompt(scenario: string, style: string, mode: string): string {
  // 根據個性調整回話風格，影響 token 用量和對話感覺
  const styleGuide: Record<string, string> = {
    '溫柔體貼': '說話輕柔，會主動關心，句子較短，不會一次說太多。',
    '幽默風趣': '愛插一兩句玩笑，但不誇張，節奏輕快，不說廢話。',
    '理性穩重': '說話簡練有重點，不廢話，偶爾才說一句有深度的話。',
    '活潑外向': '話多一點，反應快，會多問一個問題，語氣輕鬆。',
    '神秘低調': '話少，說的每句都有點意思，不太解釋自己，留白多。',
  }

  const styleNote = styleGuide[style] || '自然口語，不過多。'

  const lengthRule = mode === 'quick'
    ? '每次只說1到2句，超過就太多了。'
    : '每次2到3句，不要超過3句。'

  return `情境：${scenario}。個性：${style}。${styleNote}

${lengthRule}回應格式：先一句*動作或表情*，再說話，緊接在後。
例：*笑了一下* 你也常來這邊嗎？

規則：台灣口語。不重複。對方回短你也回短。有曖昧感但不直白。不提AI。`
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
