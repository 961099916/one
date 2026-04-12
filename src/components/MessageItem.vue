<template>
  <div :class="['message-wrapper', message.role === 'assistant' ? 'wrapper-assistant' : 'wrapper-user']">
    <div :class="['message-item', message.role === 'assistant' ? 'item-assistant' : 'item-user']">
      <div v-if="message.role === 'assistant'" class="avatar assistant-avatar">
        <n-icon size="20">
          <sparkles-outline />
        </n-icon>
      </div>
      <div class="message-content">
        <div v-if="message.content" class="markdown-content">
          <div class="markdown-body" v-html="renderMarkdown(message.content)"></div>
        </div>
        <span v-if="showCursor" class="cursor"></span>
      </div>
      <div v-if="message.role === 'user'" class="avatar user-avatar">
        <n-icon size="20">
          <person-outline />
        </n-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import 'github-markdown-css/github-markdown.css'
import type { ChatMessage } from '@/types'
import { SparklesOutline, PersonOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

interface Props {
  message: ChatMessage
  showCursor?: boolean
}

withDefaults(defineProps<Props>(), {
  showCursor: false
})

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        )
      } catch (__) {
        /* ignore */
      }
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>'
  },
})

const renderMarkdown = (text: string) => {
  return md.render(text || '')
}
</script>

<style scoped>
.message-wrapper {
  display: flex;
  margin-bottom: 24px;
  width: 100%;
}

.wrapper-assistant {
  justify-content: flex-start;
}

.wrapper-user {
  justify-content: flex-end;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.item-user {
  flex-direction: row;
}

.item-assistant {
  flex-direction: row;
}

/* 头像 */
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.assistant-avatar {
  background: linear-gradient(135deg, #165dff, #3c7eff);
  color: white;
}

.user-avatar {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

/* 消息内容气泡 */
.message-content {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.item-assistant .message-content {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-top-left-radius: 4px;
  color: var(--text-primary);
}

.item-user .message-content {
  background: var(--primary-color);
  color: white;
  border-top-right-radius: 4px;
}

.markdown-content {
  word-break: break-word;
}

/* 光标动画 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: var(--primary-color);
  margin-left: 4px;
  animation: blink 1.4s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Override GitHub Markdown Styles */
:deep(.markdown-body) {
  background-color: transparent !important;
  color: inherit !important;
  font-family: inherit !important;
  font-size: inherit !important;
  padding: 0 !important;
  margin: 0 !important;
}

.item-user :deep(.markdown-body) {
  color: white !important;
}

:deep(.markdown-body pre) {
  background-color: rgba(0, 0, 0, 0.05) !important;
  border-radius: 8px !important;
  padding: 12px !important;
  margin: 8px 0 !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

[data-theme="dark"] :deep(.markdown-body pre) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

:deep(.markdown-body code) {
  background-color: rgba(0, 82, 204, 0.1) !important;
  color: var(--primary-color) !important;
  padding: 2px 4px !important;
  border-radius: 4px !important;
  font-size: 0.9em !important;
}

.item-user :deep(.markdown-body code) {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

:deep(.markdown-body p) {
  margin: 0 0 8px 0 !important;
}

:deep(.markdown-body p:last-child) {
  margin-bottom: 0 !important;
}

@media (max-width: 768px) {
  .message-item {
    max-width: 95%;
  }
  .message-content {
    padding: 10px 14px;
    font-size: 13px;
  }
}
</style>
