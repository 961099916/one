<template>
  <div :class="['message-wrapper', message.role]">
    <!-- AI 消息 -->
    <template v-if="message.role === 'assistant'">
      <div class="assistant-message">
        <div class="avatar">
          <n-icon size="20" color="#fff"><sparkles /></n-icon>
        </div>
        <div class="content">
          <!-- 工具调用 -->
          <div v-if="message.tool_calls?.length" class="tool-calls">
            <div class="tool-header" @click="showTools = !showTools">
              <n-icon size="14"><terminal-outline /></n-icon>
              <span>已调用 {{ message.tool_calls.length }} 个工具</span>
              <n-icon size="12" class="arrow" :class="{ expanded: showTools }"><chevron-down-outline /></n-icon>
            </div>
            <div v-show="showTools" class="tool-list">
              <div v-for="tool in message.tool_calls" :key="tool.id" class="tool-item">
                <span class="tool-name">{{ tool.function.name }}</span>
                <span class="tool-status">✓</span>
              </div>
            </div>
          </div>

          <!-- 消息内容 -->
          <div class="message-text" v-html="renderedContent" />

          <!-- 光标动画 -->
          <span v-if="isGenerating" class="cursor" />

          <!-- 操作按钮 -->
          <div v-if="!isGenerating" class="message-actions">
            <button class="action-btn" @click="copyContent" title="复制">
              <n-icon size="16"><copy-outline /></n-icon>
            </button>
            <button class="action-btn" @click="$emit('regenerate')" title="重新生成">
              <n-icon size="16"><refresh-outline /></n-icon>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 用户消息 -->
    <template v-else-if="message.role === 'user'">
      <div class="user-message">
        <div class="user-bubble">
          {{ message.content }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import type { ChatMessage } from '@/types'
import {
  Sparkles, TerminalOutline, ChevronDownOutline,
  CopyOutline, RefreshOutline
} from '@vicons/ionicons5'
import { NIcon, useMessage } from 'naive-ui'

interface Props {
  message: ChatMessage
  isLast?: boolean
  isGenerating?: boolean
}

const props = defineProps<Props>()
defineEmits<{
  regenerate: []
}>()

const messageApi = useMessage()
const showTools = ref(false)

// 代码高亮函数
function highlightCode(str: string, lang?: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
    } catch {
      // 高亮失败，返回转义后的原文
    }
  }
  // 使用 md.utils.escapeHtml 转义 HTML 特殊字符
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
}

// Markdown 渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    const language = lang || 'text'
    const highlighted = highlightCode(str, lang)

    return `<div class="code-block">
      <div class="code-header">
        <span class="code-lang">${language}</span>
        <button class="copy-code-btn" data-code="${encodeURIComponent(str)}">复制</button>
      </div>
      <pre><code class="hljs">${highlighted}</code></pre>
    </div>`
  }
})

const renderedContent = computed(() => {
  return md.render(props.message.content || '')
})

function copyContent() {
  navigator.clipboard.writeText(props.message.content).then(() => {
    messageApi.success('已复制到剪贴板')
  })
}
</script>

<style scoped>
:root {
  --primary-color: #1890ff;
  --primary-light: #e6f7ff;
  --text-primary: #1f1f1f;
  --text-secondary: #666666;
  --text-placeholder: #999999;
  --border-light: #f0f0f0;
  --bg-card: #ffffff;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

.message-wrapper {
  width: 100%;
  margin-bottom: 28px;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== AI 消息 ========== */
.assistant-message {
  display: flex;
  gap: 16px;
  max-width: 100%;
  justify-content: flex-start;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.assistant-message:hover {
  box-shadow: var(--shadow-md);
}

.avatar {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #096dd9 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.35);
}

.content {
  flex: 1;
  min-width: 0;
}

/* 工具调用 */
.tool-calls {
  margin-bottom: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.tool-header:hover {
  background: var(--primary-light);
}

.tool-header .arrow {
  margin-left: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tool-header .arrow.expanded {
  transform: rotate(180deg);
}

.tool-list {
  padding: 0 14px 14px;
}

.tool-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--primary-light);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  font-size: 13px;
}

.tool-item:last-child {
  margin-bottom: 0;
}

.tool-name {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--primary-color);
  font-weight: 500;
}

.tool-status {
  color: #52c41a;
  font-weight: 600;
  font-size: 14px;
}

/* 消息文本 */
.message-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
}

/* 光标动画 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 20px;
  background: var(--primary-color);
  margin-left: 4px;
  animation: blink 1s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 操作按钮 */
.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(4px);
}

.assistant-message:hover .message-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-placeholder);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* ========== 用户消息 ========== */
.user-message {
  display: flex;
  justify-content: flex-end;
  max-width: 100%;
}

.user-bubble {
  max-width: 75%;
  background: linear-gradient(135deg, var(--primary-color) 0%, #096dd9 100%);
  color: #ffffff;
  padding: 16px 22px;
  border-radius: var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl);
  font-size: 15px;
  line-height: 1.7;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-bubble:hover {
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.35);
  transform: translateY(-1px);
}

/* ========== Markdown 样式 ========== */
:deep(.message-text p) {
  margin: 0.8em 0;
}

:deep(.message-text p:first-child) {
  margin-top: 0;
}

:deep(.message-text p:last-child) {
  margin-bottom: 0;
}

/* 代码块 */
:deep(.code-block) {
  margin: 16px 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  background: #1a1a2e;
}

:deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #252542;
  border-bottom: 1px solid #333355;
}

:deep(.code-lang) {
  font-size: 12px;
  color: #8888aa;
  font-family: monospace;
  text-transform: uppercase;
}

:deep(.copy-code-btn) {
  background: transparent;
  border: 1px solid #444466;
  color: #8888aa;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.copy-code-btn:hover) {
  background: #333355;
  color: #aaaacc;
}

:deep(.message-text pre) {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

:deep(.message-text code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 行内代码 */
:deep(.message-text :not(pre) > code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #165dff;
}

/* 表格 */
:deep(.message-text table) {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  background: var(--bg-card);
}

:deep(.message-text th) {
  background: linear-gradient(135deg, var(--primary-light) 0%, #d6e4ff 100%);
  padding: 14px 18px;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid var(--border-light);
  color: var(--primary-color);
  font-size: 14px;
  letter-spacing: 0.3px;
}

:deep(.message-text td) {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-light);
  font-size: 14px;
  line-height: 1.6;
}

:deep(.message-text tr:hover td) {
  background: var(--primary-light);
}

:deep(.message-text tr:last-child td) {
  border-bottom: none;
}

/* 列表 */
:deep(.message-text ul),
:deep(.message-text ol) {
  padding-left: 24px;
  margin: 8px 0;
}

:deep(.message-text li) {
  margin: 4px 0;
}

/* 引用 */
:deep(.message-text blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 4px solid #165dff;
  background: #f8f9fa;
  border-radius: 0 8px 8px 0;
}

/* 链接 */
:deep(.message-text a) {
  color: #165dff;
  text-decoration: none;
}

:deep(.message-text a:hover) {
  text-decoration: underline;
}
</style>
