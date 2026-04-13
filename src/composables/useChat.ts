/**
 * 聊天功能 Composable
 * 已重构：移除 Dexie messageDB 依赖，改由 chatStore 通过 IPC 写入 SQLite
 */
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore, useSettingsStore } from '@/stores'
import { RoutePath } from '@/constants'
import { log } from '@/utils'
import { chatService, electronService } from '@/services'

export function useChat() {
  const router = useRouter()
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()

  const messagesContainer = ref<HTMLElement | null>(null)
  const inputRef = ref<HTMLTextAreaElement | null>(null)
  const input = ref('')

  const messages = computed(() => chatStore.currentMessages)
  const isGenerating = computed(() => chatStore.isGenerating)
  const activeAiProvider = computed(() => settingsStore.activeAiProvider)

  // 存储清理函数
  const cleanups: (() => void)[] = []

  /** 滚动到底部 */
  const scrollToBottom = async (): Promise<void> => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }

  /** 跳转到设置页面 */
  const goToSettings = (): void => {
    router.push(RoutePath.SETTINGS)
  }

  /** 发送消息 */
  const sendMessage = async (): Promise<void> => {
    const userInput = input.value.trim()
    if (!userInput || isGenerating.value) return

    // 添加用户消息（同时写入 SQLite）
    await chatStore.addMessage({ role: 'user', content: userInput })
    input.value = ''

    // 添加助手消息占位符（也写入 SQLite，后续流式追加）
    await chatStore.addMessage({ role: 'assistant', content: '' })
    chatStore.setGenerating(true)
    scrollToBottom()

    // 构建历史（排除最后一条空的 assistant 占位）
    const history = chatStore.currentMessages.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    chatService.startChat({
      prompt: userInput,
      history,
      params: { ...settingsStore.generationParams },
    })
    log.info('Message sent:', userInput.slice(0, 50))
  }

  /** 取消生成 */
  const stopGeneration = (): void => {
    if (isGenerating.value) {
      chatService.stopChat()
      log.info('User requested to stop generation')
    }
  }

  /** 处理流式 token */
  let assistantBuffer = ''

  const handleChatToken = (token: string): void => {
    if (!chatStore.currentSession || chatStore.currentMessages.length === 0) return
    const lastMessage = chatStore.currentMessages[chatStore.currentMessages.length - 1]
    if (lastMessage.role !== 'assistant') return

    lastMessage.content += token
    assistantBuffer = lastMessage.content
    scrollToBottom()
  }

  /** 处理聊天结束 */
  const handleChatEnd = async (): Promise<void> => {
    chatStore.setGenerating(false)

    // 将完整的 assistant 回复更新到 SQLite
    if (assistantBuffer && chatStore.currentSessionId) {
      await chatStore.updateLastAssistantContent(assistantBuffer)
    }
    assistantBuffer = ''

    nextTick(() => inputRef.value?.focus())
    log.info('Chat ended')
  }

  /** 处理聊天错误 */
  const handleChatError = (error: string): void => {
    chatStore.setGenerating(false)
    assistantBuffer = ''

    if (chatStore.currentMessages.length > 0) {
      const lastMessage = chatStore.currentMessages[chatStore.currentMessages.length - 1]
      if (lastMessage.role === 'assistant') {
        lastMessage.content = lastMessage.content + `\n[错误: ${error}]`
      }
    }
    log.error('Chat error:', error)
  }

  const chatStatus = ref('')

  /** 处理状态更新 */
  const handleChatStatus = (status: string): void => {
    chatStatus.value = status
  }

  onMounted(() => {
    // 订阅聊天事件
    cleanups.push(chatService.onToken(handleChatToken))
    cleanups.push(chatService.onChatEnd(handleChatEnd))
    cleanups.push(chatService.onChatError(handleChatError))
    
    // 监听状态更新
    const unregisterStatus = electronService.on('chat:status', (status: string) => {
      handleChatStatus(status)
    })
    cleanups.push(unregisterStatus)
  })

  onUnmounted(() => {
    // 执行所有清理函数
    cleanups.forEach((cleanup) => cleanup())
  })

  return {
    messages,
    input,
    isGenerating,
    chatStatus,
    activeAiProvider,
    messagesContainer,
    inputRef,
    currentSession: computed(() => chatStore.currentSession),
    sortedSessions: computed(() => chatStore.sortedSessions),
    scrollToBottom,
    goToSettings,
    sendMessage,
    stopGeneration,
    createSession: chatStore.createSession,
    selectSession: chatStore.selectSession,
    deleteSession: chatStore.deleteSession,
    updateSessionTitle: chatStore.updateSessionTitle,
    clearCurrentSession: chatStore.clearCurrentSession,
  }
}
