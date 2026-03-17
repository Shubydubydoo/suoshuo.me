export type Screen = 'setup' | 'chat' | 'analysis'

export type Mode = 'quick' | 'deep'

export type Style = '溫柔體貼' | '幽默風趣' | '理性穩重' | '活潑外向' | '神秘低調'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AnalysisResult {
  chat_type: string
  preferred_interaction: string
  preferred_style: string
  response_pattern: string
  keywords: string[]
  is_short: boolean
}

export const SCENARIOS = [
  {
    label: '前同事敘舊',
    value: '你和我是前同事，一起工作過兩年，現在各自換了工作，今天在路上碰到，找了家咖啡廳坐下來敘舊'
  },
  {
    label: '朋友的朋友',
    value: '你是我朋友介紹認識的人，我們第一次單獨見面吃午餐，有共同朋友但彼此還在試探'
  },
  {
    label: '同學重逢',
    value: '你是我高中同學，畢業後各走各路，某天在健身房重新遇到，已經加了 IG 但今天才真正說到話'
  },
  {
    label: '社團老朋友',
    value: '你和我大學時在同個社團，關係算熟但不是最好的那種，現在出社會後偶爾還會約出來'
  },
  {
    label: '遠距重新聯繫',
    value: '你是我認識幾年的朋友，之前因為各自忙碌斷聯了一陣子，最近重新開始聊天，正在重新熟悉對方'
  },
  {
    label: '工作上的夥伴',
    value: '你和我是不同部門的同事，因為合作專案認識，私下也會傳訊息，介於同事和朋友之間'
  },
  {
    label: '鄰居熟臉',
    value: '你是我住了半年的鄰居，平常點頭之交，但最近開始在公寓大廳或附近的店聊起來，越來越熟'
  },
  {
    label: '老朋友的新面貌',
    value: '你是我認識五年以上的老朋友，彼此都很熟，但最近你有點不一樣了，說話方式和以前有些改變，讓我有點好奇'
  },
] as const

export const STYLES: Style[] = ['溫柔體貼', '幽默風趣', '理性穩重', '活潑外向', '神秘低調']
