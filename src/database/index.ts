/**
 * 渲染进程 IndexedDB（Dexie.js）
 *
 * 用于前端临时缓存和状态持久化
 */
import Dexie, { Table } from 'dexie'

// ==================== 类型定义 ====================

export interface CacheItem {
  id?: number
  key: string
  value: unknown
  expiresAt?: number // 过期时间戳，undefined 表示永不过期
  createdAt: number
}

export interface UiState {
  id?: number
  key: string
  value: unknown
  updatedAt: number
}

export interface Draft {
  id?: number
  sessionId: string
  content: string
  updatedAt: number
}

// ==================== Dexie 数据库 ====================

class OneAIDatabase extends Dexie {
  // 缓存表：临时数据，可设置过期时间
  cache!: Table<CacheItem>

  // UI 状态表：UI 相关的临时状态
  uiState!: Table<UiState>

  // 草稿表：未发送的消息草稿
  drafts!: Table<Draft>

  constructor() {
    super('OneAI')

    this.version(1).stores({
      cache: '++id, key, expiresAt',
      uiState: '++id, key',
      drafts: '++id, sessionId',
    })
  }
}

const db = new OneAIDatabase()

// ==================== 缓存操作 ====================

export const cacheOps = {
  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    const item = await db.cache.get({ key })
    if (!item) return null

    // 检查是否过期
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await db.cache.delete(item.id!)
      return null
    }

    return item.value as T
  },

  /**
   * 设置缓存
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const now = Date.now()
    const expiresAt = ttl ? now + ttl : undefined

    await db.cache.put({
      key,
      value,
      expiresAt,
      createdAt: now,
    })
  },

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    await db.cache.where('key').equals(key).delete()
  },

  /**
   * 清空过期缓存
   */
  async clearExpired(): Promise<void> {
    await db.cache.where('expiresAt').below(Date.now()).delete()
  },

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    await db.cache.clear()
  },
}

// ==================== UI 状态操作 ====================

export const uiStateOps = {
  /**
   * 获取 UI 状态
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const item = await db.uiState.get({ key })
    return (item?.value as T) ?? defaultValue
  },

  /**
   * 设置 UI 状态
   */
  async set(key: string, value: unknown): Promise<void> {
    await db.uiState.put({
      key,
      value,
      updatedAt: Date.now(),
    })
  },

  /**
   * 批量获取 UI 状态
   */
  async getMany<T extends Record<string, unknown>>(keys: string[]): Promise<Partial<T>> {
    const items = await db.uiState.where('key').anyOf(keys).toArray()
    const result: Record<string, unknown> = {}
    for (const item of items) {
      result[item.key] = item.value
    }
    return result as Partial<T>
  },

  /**
   * 批量设置 UI 状态
   */
  async setMany(states: Record<string, unknown>): Promise<void> {
    const now = Date.now()
    const items = Object.entries(states).map(([key, value]) => ({
      key,
      value,
      updatedAt: now,
    }))
    await db.uiState.bulkPut(items)
  },

  /**
   * 删除 UI 状态
   */
  async delete(key: string): Promise<void> {
    await db.uiState.where('key').equals(key).delete()
  },
}

// ==================== 草稿操作 ====================

export const draftOps = {
  /**
   * 获取会话草稿
   */
  async get(sessionId: string): Promise<string | null> {
    const draft = await db.drafts.get({ sessionId })
    return draft?.content ?? null
  },

  /**
   * 保存会话草稿
   */
  async save(sessionId: string, content: string): Promise<void> {
    await db.drafts.put({
      sessionId,
      content,
      updatedAt: Date.now(),
    })
  },

  /**
   * 删除会话草稿
   */
  async delete(sessionId: string): Promise<void> {
    await db.drafts.where('sessionId').equals(sessionId).delete()
  },

  /**
   * 清空所有草稿
   */
  async clear(): Promise<void> {
    await db.drafts.clear()
  },
}

// 定期清理过期缓存
setInterval(() => {
  cacheOps.clearExpired().catch(console.error)
}, 5 * 60 * 1000) // 每 5 分钟

export default db
