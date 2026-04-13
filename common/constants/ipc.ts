/**
 * IPC 通信通道常量
 */
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
  APP_GET_MAC_ADDRESS: 'app:get-mac-address',

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
  DB_GET_SENTIMENT_CYCLE: 'db:get-sentiment-cycle',
  DB_GET_LATEST_TRADING_DAY: 'db:get-latest-trading-day',

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

  // 窗口控制
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_UNMAXIMIZE: 'window:unmaximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  WINDOW_SET_TITLEBAR_COLOR: 'window:set-titlebar-color',
} as const

export type IpcChannelType = (typeof IpcChannel)[keyof typeof IpcChannel]
