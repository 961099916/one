import { electronService } from '@/services'

/** 获取安全的底层 API 实例 */
export const getAPI = () => {
  return window.electronAPI
}

/** 
 * 检查当前是否在 Electron 环境中
 */
export const isElectron = () => {
  return electronService.isElectron
}

export * from './app'
export * from './market'
export * from './config'
export * from './integration'
