<template>
  <div :class="message.role === 'assistant' ? 'message-assistant' : 'message-user'">
    <div class="message-container">
      <div :class="message.role === 'assistant' ? 'assistant-avatar' : 'user-avatar'" class="avatar">
        <n-icon size="18">
          <sparkles-outline v-if="message.role === 'assistant'" />
          <person-outline v-else />
        </n-icon>
      </div>
      <div class="message-content">
        <div v-if="message.content" class="markdown-content">
          <div class="markdown-body" v-html="renderMarkdown(message.content)"></div>
        </div>
        <span v-if="showCursor" class="cursor"></span>
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
/* 消息样式 */
.message-assistant {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.message-user {
  background: var(--bg-primary);
}

.message-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* 头像 */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.assistant-avatar {
  background: var(--primary-color);
}

.user-avatar {
  background: var(--text-tertiary);
}

/* 消息内容 */
.message-content {
  flex: 1;
  min-width: 0;
  padding-top: 3px;
}

.markdown-content {
  line-height: 1.6;
  font-size: 14px;
}

/* 光标动画 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 18px;
  background: var(--primary-color);
  margin-left: 4px;
  animation: blink 1.4s infinite;
  vertical-align: text-bottom;
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
  padding: 0 !important;
  margin: 0 !important;
}
:deep(.markdown-body pre) {
  background-color: var(--bg-tertiary) !important;
  border-radius: var(--border-radius-md) !important;
  padding: 12px !important;
  margin: 8px 0 !important;
  overflow-x: auto !important;
}
:deep(.markdown-body code) {
  background-color: rgba(0, 82, 204, 0.1) !important;
  color: var(--primary-color) !important;
  padding: 2px 6px !important;
  border-radius: 3px !important;
  font-size: 0.9em !important;
}
:deep(.markdown-body pre code) {
  background-color: transparent !important;
  padding: 0 !important;
}
:deep(.markdown-body a) {
  color: var(--primary-color) !important;
  text-decoration: none !important;
}
:deep(.markdown-body a:hover) {
  text-decoration: underline !important;
}
:deep(.markdown-body p) {
  margin: 0 0 8px 0 !important;
}
:deep(.markdown-body ul, .markdown-body ol) {
  margin: 0 0 8px 24px !important;
}
:deep(.markdown-body blockquote) {
  border-left: 3px solid var(--border-color) !important;
  padding-left: 16px !important;
  margin: 8px 0 !important;
  color: var(--text-secondary) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-container {
    padding: 12px 16px;
    gap: 10px;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
  
  .markdown-content {
    font-size: 13px;
    line-height: 1.5;
  }
}
</style>
