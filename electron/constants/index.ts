/**
 * Electron 主进程常量
 */

// ==================== 窗口配置 ====================
export const WindowConfig = {
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
} as const

// ==================== 下载配置 ====================
export const DownloadConfig = {
  MIN_FILE_SIZE: 1024 * 1024, // 1MB
  REDIRECT_STATUS_CODES: [301, 302, 303, 307, 308],
} as const

// ==================== API 配置 ====================

/** 选股通 API 配置 */
export const XuanguBaoConfig = {
  /** API 基础地址 */
  API_BASE: 'https://flash-api.xuangubao.com.cn/api',
  /** API 端点 */
  ENDPOINTS: {
    /** 市场指标 */
    MARKET_INDICATOR: '/market_indicator/line',
  },
  /** API 字段 */
  FIELDS: {
    /** 涨跌数量 */
    RISE_FALL_COUNT: 'rise_count,fall_count',
  },
} as const

// ==================== HTTP 配置 ====================

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

// ==================== 日志标签 ====================

/** 日志标签常量 */
export const LogTags = {
  /** 选股通服务 */
  XUANGUBAO: '[XuanguBao]',
  /** 同花顺服务 */
  TONGHUASHUN: '[TongHuaShun]',
} as const

// ==================== 同花顺配置 ====================

/** 同花顺 URL Scheme 配置 */
export const TongHuaShunConfig = {
  /** URL Scheme 协议 */
  SCHEMES: {
    /** 同花顺主协议 */
    AMIHEXIN: 'amihexin://',
    /** 同花顺备用协议 */
    FLS: 'fls://',
  },
  /** URL 路径模板 */
  PATHS: {
    /** 股票页面 */
    STOCK: '/stock/',
    /** 股票页面 (FLS) */
    STOCK_PAGE: '/stockpage/',
  },
  /** 错误消息 */
  ERROR_MESSAGES: {
    /** 打开失败通用消息 */
    OPEN_FAILED: '打开同花顺失败',
    /** 未安装提示 */
    NOT_INSTALLED: '无法打开同花顺，请确保已安装同花顺软件',
  },
} as const

// IPC 事件通道
export const IpcChannel = {
  // 模型相关
  LIST_MODELS: 'list-models',
  DOWNLOAD_MODEL: 'download-model',
  DELETE_MODEL: 'delete-model',
  IMPORT_MODEL: 'import-model',
  SET_ACTIVE_MODEL: 'set-active-model',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETE: 'download-complete',

  // 聊天相关
  START_CHAT: 'start-chat',
  STOP_CHAT: 'stop-chat',
  CHAT_TOKEN: 'chat-token',
  CHAT_END: 'chat-end',
  CHAT_ERROR: 'chat-error',

  // 系统相关
  MAIN_PROCESS_MESSAGE: 'main-process-message',

  // 应用操作
  APP_GET_VERSION: 'app:get-version',
  APP_GET_ENV_INFO: 'app:get-env-info',
  APP_OPEN_LOG_DIR: 'app:open-log-dir',
  APP_RELAUNCH: 'app:relaunch',
  APP_SET_LOGIN_ITEM: 'app:set-login-item',
  APP_GET_LOGIN_ITEM: 'app:get-login-item',

  // 自动更新
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_INSTALL: 'update:install',
  UPDATE_STATUS: 'update:status', // 主进程 → 渲染进程推送

  // 数据库（SQLite）
  DB_GET_SESSIONS: 'db:get-sessions',
  DB_CREATE_SESSION: 'db:create-session',
  DB_UPDATE_SESSION: 'db:update-session',
  DB_DELETE_SESSION: 'db:delete-session',
  DB_GET_MESSAGES: 'db:get-messages',
  DB_ADD_MESSAGE: 'db:add-message',
  DB_UPDATE_LAST_MESSAGE: 'db:update-last-message',
  DB_CLEAR_MESSAGES: 'db:clear-messages',
  DB_GET_MARKET_DATA: 'db:get-market-data',
  DB_SYNC_MARKET_DATA: 'db:sync-market-data',

  // 配置（electron-store）
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_ALL: 'config:get-all',
  CONFIG_RESET: 'config:reset',

  // 文件存储
  FILE_SAVE: 'file:save',
  FILE_SAVE_IMAGE: 'file:save-image',
  FILE_SAVE_BASE64_IMAGE: 'file:save-base64-image',
  FILE_GET_PATH: 'file:get-path',
  FILE_EXISTS: 'file:exists',
  FILE_DELETE: 'file:delete',
  FILE_READ: 'file:read',

  // 同花顺联动
  OPEN_TONGHUASHUN_STOCK: 'open-tonghuashun-stock',
  OPEN_TONGHUASHUN_APP: 'open-tonghuashun-app',
} as const
