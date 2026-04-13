/**
 * 应用基础配置与窗口状态类型定义
 */

/** 代理配置接口 */
export interface ProxyConfig {
  enable: boolean
  protocol: 'http' | 'https' | 'socks5' | 'socks'
  host: string
  port: number
}

/** 应用全局设置接口 */
export interface AppSettings {
  /** 主题设置 */
  theme: 'light' | 'dark' | 'auto'
  /** 语言设置 */
  language: 'zh-CN' | 'en-US'
  /** 是否自动检查更新 */
  autoCheckUpdate: boolean
  /** 是否发送遥测数据 */
  enableTelemetry: boolean
  /** 消息字体大小 */
  fontSize: number
  /** 侧边栏宽度 */
  sidebarWidth: number
  /** 启动时是否自动加载上次的模型 */
  autoLoadModel: boolean
  /** 通达信数据路径 (vipdoc 目录) */
  tdxPath: string
  /** 同花顺安装路径 (hexin.exe) */
  thsPath: string
  /** 联动偏好设置 */
  linkagePreference: 'tdx' | 'ths' | 'both'
  /** 网络代理设置 */
  proxy: ProxyConfig
  /** 更新镜像设置 */
  updateMirror: 'direct' | 'ghproxy' | 'custom'
  /** 自定义镜像地址 */
  customMirrorUrl: string
  /** 当前 AI 服务商: 'local' | 'openai' */
  activeAiProvider: 'local' | 'openai'
  /** OpenAI 兼容配置 */
  openAiConfig: {
    apiKey: string
    baseUrl: string
    model: string
  }
}

/** 窗口状态接口 */
export interface WindowState {
  /** 窗口宽度 */
  width: number
  /** 窗口高度 */
  height: number
  /** 窗口 X 坐标 */
  x?: number
  /** 窗口 Y 坐标 */
  y?: number
  /** 是否最大化 */
  isMaximized: boolean
}
