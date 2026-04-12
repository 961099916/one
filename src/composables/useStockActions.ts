/**
 * 股票通用操作组合式函数
 * 提供联动通达信、同花顺等外部软件的能力
 */
import { useMessage } from 'naive-ui'

export function useStockActions() {
  const message = useMessage()

  /**
   * 在通达信中打开指定个股
   * @param symbol 股票代码 (支持带前缀或纯数字)
   */
  const openInTdx = async (symbol: string) => {
    if (!symbol) return
    console.log('[useStockActions] Attempting to open stock:', symbol)

    try {
      const api = (window as any).electronAPI
      if (!api?.tdx?.openStock) {
        message.error('系统接口未就绪，无法唤起外部程序')
        return
      }

      // 预处理代码：去除所有非数字字符以便适配 tdx:// 协议 (通常协议只需要 6 位数字)
      const pureCode = symbol.replace(/[^0-9]/g, '')
      
      const res = await api.tdx.openStock(pureCode)
      
      if (!res.success) {
        message.warning(`唤起通达信失败: ${res.error || '可能是未注册 tdx:// 协议'}`)
      }
    } catch (err) {
      console.error('Failed to open TDX:', err)
      message.error('无法唤起外部程序，请检查权限设置')
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
    formatMoney
  }
}
