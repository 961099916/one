/**
 * 应用级基础配置常量
 */

// ==================== 窗口配置 ====================
export const WindowConfig = {
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
} as const

// ==================== 下载与网络配置 ====================
export const DownloadConfig = {
  MIN_FILE_SIZE: 1024 * 1024, // 1MB
  REDIRECT_STATUS_CODES: [301, 302, 303, 307, 308],
} as const

/** HTTP 头常量 */
export const HttpHeaders = {
  /** Accept 头 */
  ACCEPT_JSON: 'application/json',
  /** User-Agent 头 */
  USER_AGENT: 'One AI App',
} as const

/** HTTP 方法 */
export const HttpMethods = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const
