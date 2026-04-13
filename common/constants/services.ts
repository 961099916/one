/**
 * 外部服务配置与集成常量
 */

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

/** 日志标签常量 */
export const LogTags = {
  /** 选股通服务 */
  XUANGUBAO: '[XuanguBao]',
  /** 同花顺服务 */
  TONGHUASHUN: '[TongHuaShun]',
  /** 通达信服务 */
  TDX: '[TDX]',
} as const
