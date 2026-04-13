/**
 * 系统任务与后台进程相关类型定义
 */

/** 下载进度接口 */
export interface DownloadProgress {
  name: string
  progress: number
}

/** 下载完成结果接口 */
export interface DownloadResult {
  success: boolean
  name?: string
  error?: string
}
