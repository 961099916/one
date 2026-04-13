import { getAPI } from './index'
import type { AppSettings } from '@/types'

export const configApi = {
  get: <K extends keyof AppSettings>(key: K): Promise<AppSettings[K] | undefined> => {
    return getAPI()?.config.get(key as string) as Promise<AppSettings[K] | undefined>
  },
  
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<{ success: boolean }> => {
    return getAPI()?.config.set(key as string, value) as Promise<{ success: boolean }>
  },
  
  getAll: (): Promise<AppSettings> => {
    return getAPI()?.config.getAll() as Promise<AppSettings>
  },
  
  reset: (): Promise<{ success: boolean }> => {
    return getAPI()?.config.reset() as Promise<{ success: boolean }>
  }
}
