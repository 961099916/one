/**
 * 本地存储工具封装
 * 统一的存储接口，基于 localStorage
 */
import { log } from '@/utils/logger'

// 存储键前缀
const STORAGE_PREFIX = 'one_ai_'

/**
 * localStorage 同步存储
 */
export const syncStorage = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      if (item === null) {
        return defaultValue ?? null
      }
      return JSON.parse(item) as T
    } catch {
      return defaultValue ?? null
    }
  },

  set(key: string, value: unknown): void {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(STORAGE_PREFIX + key, serialized)
    } catch (e) {
      log.warn('[Storage] Failed to save to localStorage:', e)
    }
  },

  remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },

  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  },
}

// 默认导出 syncStorage
export default syncStorage
