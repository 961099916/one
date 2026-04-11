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
    /** 股票池详情（涨停池、炸板池等） */
    STOCK_POOL: '/pool/detail',
    /** 追涨热力板 - 板块 */
    SURGE_PLATES: '/surge_stock/plates',
    /** 追涨热力板 - 个股详情 */
    SURGE_STOCKS: '/surge_stock/stocks',
  },
  /** API 字段 */
  FIELDS: {
    /** 涨跌数量 */
    RISE_FALL_COUNT: 'rise_count,fall_count',
    /** 涨跌停数量 */
    LIMIT_UP_DOWN_COUNT: 'limit_up_count,limit_down_count',
    /** 炸板数据 */
    LIMIT_UP_BROKEN: 'limit_up_broken_count,limit_up_broken_ratio',
    /** 市场温度 */
    MARKET_TEMPERATURE: 'market_temperature',
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
  /** 通达信服务 */
  TDX: '[TDX]',
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
  APP_PROXY_FETCH: 'app:proxy-fetch',
  APP_SELECT_DIRECTORY: 'app:select-directory',

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
  DB_GET_ALL_TRADING_DAYS: 'db:get-all-trading-days',
  DB_UPDATE_TRADING_DAY: 'db:update-trading-day',
  DB_GET_STOCK_POOL: 'db:get-stock-pool',
  DB_SYNC_STOCK_POOL: 'db:sync-stock-pool',
  DB_BATCH_SYNC_XUANGUBAO: 'db:batch-sync-xuangubao',
  DB_GET_SURGE_PLATES: 'db:get-surge-plates',
  DB_GET_SURGE_STOCKS: 'db:get-surge-stocks',
  DB_SYNC_SURGE_DATA: 'db:sync-surge-data',
  DB_GET_LATEST_SURGE_TIMESTAMP: 'db:get-latest-surge-timestamp',
  DB_GET_SURGE_TIMESTAMPS: 'db:get-surge-timestamps',
  DB_GET_SURGE_HISTORICAL_DATES: 'db:get-surge-historical-dates',

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

  // 通达信本地数据
  TDX_GET_MINUTE_DATA: 'tdx:get-minute-data',
  TDX_OPEN_STOCK: 'tdx:open-stock',
} as const
