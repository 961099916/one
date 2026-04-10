/**
 * UI 服务
 * 封装与浏览器 DOM 相关的副作用操作，如主题切换、全局样式变量控制等
 */

export type Theme = 'light' | 'dark' | 'auto'

class UIService {
  /**
   * 应用主题
   */
  applyTheme(theme: Theme): void {
    const html = document.documentElement
    html.removeAttribute('data-theme')

    let resolved: 'light' | 'dark'
    if (theme === 'auto') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = theme
    }
    html.setAttribute('data-theme', resolved)
  }

  /**
   * 设置全局 CSS 变量
   */
  setCssVariable(name: string, value: string): void {
    document.documentElement.style.setProperty(name, value)
  }

  /**
   * 获取系统主题偏好
   */
  getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  /**
   * 监听系统主题变化
   */
  onSystemThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => {
      callback(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }
}

export const uiService = new UIService()
