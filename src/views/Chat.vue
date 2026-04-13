<template>
  <div class="chat-layout">
    <!-- 左侧会话列表 -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="createNewChat">
          <n-icon size="18"><add-outline /></n-icon>
          <span>新建对话</span>
        </button>
      </div>

      <div class="session-list">
        <div
          v-for="session in chatStore.sortedSessions"
          :key="session.id"
          class="session-item"
          :class="{ active: chatStore.currentSessionId === session.id }"
          @click="chatStore.selectSession(session.id)"
        >
          <n-icon size="16" class="session-icon"><chatbubble-outline /></n-icon>
          <span class="session-title">{{ session.title }}</span>
          <div class="session-actions" @click.stop>
            <button class="action-btn" @click="startRename(session)">
              <n-icon size="14"><create-outline /></n-icon>
            </button>
            <button class="action-btn" @click="confirmDelete(session.id)">
              <n-icon size="14"><trash-outline /></n-icon>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主聊天区 -->
    <main class="chat-main">
      <!-- 顶部导航 -->
      <header class="chat-header">
        <div class="header-left">
          <button class="toggle-btn" @click="isSidebarCollapsed = !isSidebarCollapsed">
            <n-icon size="20"><menu-outline /></n-icon>
          </button>
        </div>
        <div class="header-center">
          <span class="model-tag">{{ settingsStore.activeAiProvider.toUpperCase() }}</span>
        </div>
        <div class="header-right">
          <button v-if="chatStore.currentMessages.length > 0" class="clear-btn" @click="clearChat">
            <n-icon size="18"><refresh-outline /></n-icon>
          </button>
        </div>
      </header>

      <!-- 消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <!-- 空状态 -->
        <div v-if="chatStore.currentMessages.length === 0" class="empty-state">
          <div class="brand">
            <div class="logo">
              <n-icon size="48" color="#165dff"><sparkles /></n-icon>
            </div>
            <h1 class="title">壹复盘 AI</h1>
            <p class="subtitle">专业的 A 股短线复盘助手</p>
          </div>

          <div class="quick-prompts">
            <div class="prompt-card" @click="sendQuickPrompt('今日市场情绪如何？')">
              <n-icon size="20" color="#165dff"><trending-up-outline /></n-icon>
              <span>今日市场情绪</span>
            </div>
            <div class="prompt-card" @click="sendQuickPrompt('分析一下涨停梯队')">
              <n-icon size="20" color="#00b578"><layers-outline /></n-icon>
              <span>涨停梯队分析</span>
            </div>
            <div class="prompt-card" @click="sendQuickPrompt('推荐几只短线标的')">
              <n-icon size="20" color="#ff7d00"><flash-outline /></n-icon>
              <span>短线标的推荐</span>
            </div>
            <div class="prompt-card" @click="sendQuickPrompt('解读一下今日龙虎榜')">
              <n-icon size="20" color="#722ed1"><bar-chart-outline /></n-icon>
              <span>龙虎榜解读</span>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="messages-list">
          <ChatMessage
            v-for="(msg, index) in chatStore.currentMessages"
            :key="index"
            :message="msg"
            :is-last="index === chatStore.currentMessages.length - 1"
            :is-generating="chatStore.isGenerating && index === chatStore.currentMessages.length - 1 && msg.role === 'assistant'"
          />
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            ref="inputRef"
            v-model="inputMessage"
            class="message-input"
            :placeholder="chatStore.isGenerating ? 'AI 正在思考...' : '输入您的问题...'"
            :disabled="chatStore.isGenerating"
            rows="1"
            @keydown="handleKeydown"
            @input="autoResize"
          />
          <div class="input-actions">
            <button
              v-if="chatStore.isGenerating"
              class="send-btn stop"
              @click="stopGeneration"
            >
              <n-icon size="20"><stop-outline /></n-icon>
            </button>
            <button
              v-else
              class="send-btn"
              :disabled="!inputMessage.trim()"
              @click="handleSendMessage"
            >
              <n-icon size="20"><arrow-up-outline /></n-icon>
            </button>
          </div>
        </div>
        <p class="input-tip">AI 生成内容仅供参考，不构成投资建议</p>
      </div>
    </main>

    <!-- 重命名对话框 -->
    <n-modal v-model:show="showRenameModal" preset="dialog" title="重命名会话">
      <n-input v-model:value="renameValue" placeholder="输入新名称" @keyup.enter="confirmRename" />
      <template #action>
        <n-button @click="showRenameModal = false">取消</n-button>
        <n-button type="primary" @click="confirmRename">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useChatStore, useSettingsStore } from '@/stores'
import { useChat } from '@/composables/useChat'
import ChatMessage from '@/components/ChatMessage.vue'
import {
  AddOutline, ChatbubbleOutline, CreateOutline, TrashOutline,
  MenuOutline, RefreshOutline, Sparkles, TrendingUpOutline,
  LayersOutline, FlashOutline, BarChartOutline, StopOutline,
  ArrowUpOutline
} from '@vicons/ionicons5'
import { NIcon, NModal, NInput, NButton, useDialog } from 'naive-ui'
import type { ChatSession } from '@/stores/chat'

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const dialog = useDialog()
const { sendMessage, stopGeneration } = useChat()

const inputMessage = ref('')
const inputRef = ref<HTMLTextAreaElement>()
const messagesContainer = ref<HTMLElement>()
const isSidebarCollapsed = ref(false)

// 重命名
const showRenameModal = ref(false)
const renameValue = ref('')
const renameSessionId = ref('')

function handleSendMessage() {
  const content = inputMessage.value.trim()
  if (!content || chatStore.isGenerating) return

  input.value = content
  sendMessage()
  inputMessage.value = ''
  resetInputHeight()
  scrollToBottom()
}

function sendQuickPrompt(prompt: string) {
  input.value = prompt
  sendMessage()
  scrollToBottom()
}

const input = ref('')

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

function autoResize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

function resetInputHeight() {
  const el = inputRef.value
  if (el) el.style.height = 'auto'
}

function scrollToBottom() {
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  })
}

function createNewChat() {
  chatStore.createSession()
  inputRef.value?.focus()
}

function clearChat() {
  dialog.warning({
    title: '确认清空',
    content: '确定要清空当前对话吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      chatStore.clearCurrentSession()
    }
  })
}

function startRename(session: ChatSession) {
  renameSessionId.value = session.id
  renameValue.value = session.title
  showRenameModal.value = true
}

function confirmRename() {
  if (renameValue.value.trim()) {
    chatStore.updateSessionTitle(renameSessionId.value, renameValue.value.trim())
  }
  showRenameModal.value = false
}

function confirmDelete(id: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个会话吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      chatStore.deleteSession(id)
    }
  })
}

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<style scoped>
/* ========== 全局变量 ========== */
:root {
  --primary-color: #1890ff;
  --primary-hover: #40a9ff;
  --primary-light: #e6f7ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --danger-color: #ff4d4f;
  --text-primary: #1f1f1f;
  --text-secondary: #666666;
  --text-placeholder: #999999;
  --border-color: #e8e8e8;
  --border-light: #f0f0f0;
  --bg-page: #f5f7fa;
  --bg-card: #ffffff;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.1);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

.chat-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-page);
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 280px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.sidebar.collapsed {
  width: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #096dd9 100%);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.new-chat-btn:hover {
  background: linear-gradient(135deg, var(--primary-hover) 0%, #096dd9 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
}

.new-chat-btn:active {
  transform: translateY(0);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  box-sizing: border-box;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 4px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
}

.session-item:hover {
  background: var(--primary-light);
  transform: translateX(4px);
}

.session-item.active {
  background: var(--primary-color);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.session-item.active .session-icon {
  opacity: 1;
}

.session-icon {
  flex-shrink: 0;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
}

.session-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  transform: translateX(8px);
}

.session-item:hover .session-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.session-item.active .action-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 1);
  color: var(--text-primary);
}

.session-item.active .action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ========== 主聊天区 ========== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-card);
  overflow: hidden;
}

/* 顶部导航 */
.chat-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-left,
.header-right {
  width: 80px;
}

.header-right {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.toggle-btn,
.clear-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-btn:hover,
.clear-btn:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.model-tag {
  padding: 6px 16px;
  background: linear-gradient(135deg, var(--primary-light) 0%, #b3d8ff 100%);
  border-radius: 20px;
  font-size: 12px;
  color: var(--primary-color);
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 消息区域 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
  box-sizing: border-box;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
}

.brand {
  text-align: center;
  margin-bottom: 56px;
}

.logo {
  width: 96px;
  height: 96px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, var(--primary-light) 0%, #b3d8ff 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15);
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.quick-prompts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 680px;
  width: 100%;
}

.prompt-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 28px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.prompt-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--primary-color) 0%, #096dd9 100%);
  transform: scaleY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.prompt-card:hover {
  background: var(--bg-card);
  border-color: var(--primary-color);
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15);
  transform: translateY(-3px);
}

.prompt-card:hover::before {
  transform: scaleY(1);
}

.prompt-card span {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

/* 消息列表 */
.messages-list {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
}

/* 输入区域 */
.input-area {
  padding: 20px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  min-height: 80px;
}

.input-wrapper {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 16px 22px;
  background: var(--bg-page);
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.input-wrapper:focus-within {
  background: var(--bg-card);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.12), 0 4px 16px rgba(24, 144, 255, 0.1);
}

.message-input {
  flex: 1;
  min-height: 32px;
  max-height: 120px;
  padding: 8px 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.message-input::placeholder {
  color: var(--text-placeholder);
}

.message-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, #096dd9 100%);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-hover) 0%, #096dd9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  background: #f0f0f0;
  color: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.send-btn.stop {
  background: linear-gradient(135deg, var(--danger-color) 0%, #cf1322 100%);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}

.send-btn.stop:hover {
  background: linear-gradient(135deg, #ff7875 0%, #cf1322 100%);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.input-tip {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-placeholder);
  font-weight: 400;
}
</style>
