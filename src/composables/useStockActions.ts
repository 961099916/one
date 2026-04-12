/**
 * 股票通用操作组合式函数
 * 提供联动通达信、同花顺等外部软件的能力
 */
import { useAppStore } from '@/stores'

export function useStockActions() {
  const appStore = useAppStore()

  /**
   * 在通达信中打开指定个股
   */
  const openInTdx = async (symbol: string) => {
    if (!symbol) return
    try {
      const api = (window as any).electronAPI
      if (!api?.tdx?.openStock) return
      
      const pureCode = symbol.replace(/[^0-9]/g, '')
      const res = await api.tdx.openStock(pureCode)
      if (!res.success) {
        console.warn(`[Tdx Linkage] 联动失败: ${res.error || '未知错误'}`)
      } else {
        console.info(`[Tdx Linkage] 联动成功: ${pureCode}`)
      }
    } catch (err) {
      console.error('[Tdx Linkage] 联动异常:', err)
    }
  }

  /**
   * 在同花顺中打开指定个股
   */
  const openInThs = async (symbol: string) => {
    if (!symbol) return
    try {
      const api = (window as any).electronAPI
      if (!api?.ths?.openStock) return
      
      const pureCode = symbol.replace(/[^0-9]/g, '')
      const res = await api.ths.openStock(pureCode)
      if (!res.success) {
        console.warn(`[Ths Linkage] 联动失败: ${res.error || '未知错误'}`)
      } else {
        console.info(`[Ths Linkage] 联动成功: ${pureCode}`)
      }
    } catch (err) {
      console.error('[Ths Linkage] 联动异常:', err)
    }
  }

  /**
   * 根据用户偏好自动联动外部软件
   * @param symbol 股票代码
   */
  const handleStockClick = async (symbol: string) => {
    if (!symbol) return
    const pref = appStore.settings.linkagePreference || 'tdx'
    
    if (pref === 'tdx') {
      await openInTdx(symbol)
    } else if (pref === 'ths') {
      await openInThs(symbol)
    } else if (pref === 'both') {
      // 并发打开
      Promise.all([openInTdx(symbol), openInThs(symbol)])
    }
  }

  /**
   * 格式化展示成交金额
   */
  const formatMoney = (val: number) => {
    if (val >= 100000000) return (val / 100000000).toFixed(2) + '亿'
    if (val >= 10000) return (val / 10000).toFixed(2) + '万'
    return val.toString()
  }

  return {
    openInTdx,
    openInThs,
    handleStockClick,
    formatMoney
  }
}
