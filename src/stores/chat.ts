/**
 * 聊天状态 Store
 *
 * 持久化方案：
 * - 会话列表和消息：SQLite（主进程）via IPC
 * - 当前会话 ID：electron-store（主进程）
 * - 消息草稿：Dexie.js（渲染进程 IndexedDB）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { log } from '@/utils/logger'
import type { ChatMessage } from '@/types'
import { draftOps } from '@/database'

interface SessionRow {
  id: string
  title: string
  created_at: number
  updated_at: number
}

interface MessageRow {
  id: number
  session_id: string
  role: string
  content: string
  created_at: number
}

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export const useChatStore = defineStore('chat', () => {
  // ==================== 状态 ====================

  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const isGenerating = ref(false)
  /** 是否已从 SQLite 完成初始加载 */
  const initialized = ref(false)

  // ==================== 计算属性 ====================

  const currentSession = computed(
    () => sessions.value.find(s => s.id === currentSessionId.value) ?? null
  )

  const currentMessages = computed(() => currentSession.value?.messages ?? [])

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
  )

  // ==================== 初始化（从 SQLite 加载） ====================

  /**
   * 从 SQLite 加载会话列表和当前会话的消息
   * 应在应用启动时调用一次
   */
  async function initFromDB(): Promise<void> {
    if (!window.electronAPI) return

    try {
      // 1. 加载所有会话
      const rows = (await window.electronAPI.db.getSessions()) as SessionRow[]

      sessions.value = rows.map(r => ({
        id: r.id,
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        messages: [],
      }))

      // 2. 从 electron-store 恢复上次选中的会话 ID
      const savedId = (await (window.electronAPI as any).config.get('currentSessionId')) as string
      if (savedId && sessions.value.some(s => s.id === savedId)) {
        currentSessionId.value = savedId
      } else if (sessions.value.length > 0) {
        currentSessionId.value = sessions.value[0].id
      }

      // 3. 加载当前会话的消息
      if (currentSessionId.value) {
        await loadMessages(currentSessionId.value)
      }

      initialized.value = true
    } catch (err) {
      log.error('[ChatStore] 从数据库加载失败:', err)
      initialized.value = true
    }
  }

  /**
   * 加载指定会话的消息
   */
  async function loadMessages(sessionId: string): Promise<void> {
    if (!window.electronAPI) return

    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    try {
      const rows = (await window.electronAPI.db.getMessages(sessionId)) as MessageRow[]

      session.messages = rows.map(r => ({
        role: r.role as 'user' | 'assistant',
        content: r.content,
      }))
    } catch (err) {
      log.error('[ChatStore] 加载消息失败:', err)
    }
  }

  // ==================== 草稿操作 ====================

  async function loadDraft(sessionId: string): Promise<string | null> {
    return await draftOps.get(sessionId)
  }

  async function saveDraft(sessionId: string, content: string): Promise<void> {
    await draftOps.save(sessionId, content)
  }

  async function deleteDraft(sessionId: string): Promise<void> {
    await draftOps.delete(sessionId)
  }

  // ==================== Actions ====================

  async function createSession(title?: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: generateId(),
      title: title ?? '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    }

    sessions.value.unshift(session)
    currentSessionId.value = session.id

    // 写入 SQLite
    if (window.electronAPI) {
      await window.electronAPI.db.createSession({
        id: session.id,
        title: session.title,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      })
      await (window.electronAPI as any).config.set('currentSessionId', session.id)
    }

    return session
  }

  async function selectSession(sessionId: string): Promise<void> {
    if (!sessions.value.some(s => s.id === sessionId)) return

    currentSessionId.value = sessionId

    // 按需加载消息（懒加载）
    const session = sessions.value.find(s => s.id === sessionId)!
    if (session.messages.length === 0) {
      await loadMessages(sessionId)
    }

    // 持久化当前会话 ID 到 electron-store
    if (window.electronAPI) {
      await (window.electronAPI as any).config.set('currentSessionId', sessionId)
    }
  }

  async function deleteSession(sessionId: string): Promise<void> {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index === -1) return

    sessions.value.splice(index, 1)

    if (currentSessionId.value === sessionId) {
      currentSessionId.value = sessions.value[0]?.id ?? null
      if (currentSessionId.value) {
        await loadMessages(currentSessionId.value)
      }
    }

    // 级联删除 SQLite 中的会话和消息
    if (window.electronAPI) {
      await window.electronAPI.db.deleteSession(sessionId)
    }

    // 删除草稿
    await deleteDraft(sessionId)
  }

  async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    session.title = title
    session.updatedAt = Date.now()

    if (window.electronAPI) {
      await window.electronAPI.db.updateSession(sessionId, {
        title,
        updated_at: session.updatedAt,
      })
    }
  }

  async function addMessage(message: ChatMessage): Promise<void> {
    const session = currentSession.value
    if (!session) return

    session.messages.push(message)
    session.updatedAt = Date.now()

    // 自动生成会话标题（第一条用户消息）
    if (session.messages.length === 1 && session.title === '新对话' && message.role === 'user') {
      const newTitle = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      session.title = newTitle
    }

    // 写入 SQLite
    if (window.electronAPI) {
      await window.electronAPI.db.addMessage(session.id, message.role, message.content, Date.now())
      await window.electronAPI.db.updateSession(session.id, {
        title: session.title,
        updated_at: session.updatedAt,
      })
    }
  }

  /**
   * 更新最后一条 assistant 消息内容（流式追加时使用）
   */
  async function updateLastAssistantContent(content: string): Promise<void> {
    const session = currentSession.value
    if (!session || session.messages.length === 0) return

    const lastMsg = session.messages[session.messages.length - 1]
    if (lastMsg.role !== 'assistant') return

    lastMsg.content = content
    session.updatedAt = Date.now()

    // 更新 SQLite 中最后一条消息
    if (window.electronAPI) {
      await window.electronAPI.db.updateLastMessage(session.id, content)
    }
  }

  function setGenerating(generating: boolean): void {
    isGenerating.value = generating
  }

  async function clearCurrentSession(): Promise<void> {
    const session = currentSession.value
    if (!session) return

    session.messages = []
    session.updatedAt = Date.now()

    if (window.electronAPI) {
      await window.electronAPI.db.clearMessages(session.id)
      await window.electronAPI.db.updateSession(session.id, {
        updated_at: session.updatedAt,
      })
    }
  }

  /** 启动时确保至少有一个会话 */
  async function ensureSession(): Promise<void> {
    await initFromDB()
    if (sessions.value.length === 0) {
      await createSession()
    }
  }

  return {
    sessions,
    currentSessionId,
    isGenerating,
    initialized,
    currentSession,
    currentMessages,
    sortedSessions,
    initFromDB,
    loadMessages,
    loadDraft,
    saveDraft,
    deleteDraft,
    createSession,
    selectSession,
    deleteSession,
    updateSessionTitle,
    addMessage,
    updateLastAssistantContent,
    setGenerating,
    clearCurrentSession,
    ensureSession,
  }
})

// ==================== 工具函数 ====================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
