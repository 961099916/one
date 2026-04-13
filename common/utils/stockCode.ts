/**
 * 股票代码处理工具类
 */

/**
 * 提取纯数字形式的股票代码
 * @param symbol 原始代码（如 SH600519，600519.SS）
 * @returns 纯数字代码（如 600519）
 */
export function extractPureCode(symbol: string): string {
  if (!symbol) return ''
  return symbol.replace(/[^0-9]/g, '')
}

/**
 * 将各类股票代码格式转换为标准的 Prefix + Code 格式（如 SH600519）
 * 用于通达信/同花顺等第三方软件接口调用
 * @param rawSymbol 原始代码（支持多种格式，如 000001.SZ, SH600000, 300015）
 * @returns 格式化后的代码（如 SZ000001）
 */
export function normalizeStockSymbol(rawSymbol: string): string {
  if (!rawSymbol) return ''
  
  let symbol = rawSymbol.toUpperCase()
  
  // 后缀模式判断 (如 600519.SH, 000001.SZ)
  if (symbol.endsWith('.SS') || symbol.endsWith('.SH')) {
    return 'SH' + symbol.split('.')[0]
  }
  if (symbol.endsWith('.SZ')) {
    return 'SZ' + symbol.split('.')[0]
  }
  if (symbol.endsWith('.BJ')) {
    return 'BJ' + symbol.split('.')[0]
  }
  
  // 前缀模式或纯数字模式判断
  const pureCode = extractPureCode(symbol)
  
  if (pureCode.startsWith('6')) {
    return 'SH' + pureCode
  }
  if (pureCode.startsWith('8') || pureCode.startsWith('4') || pureCode.startsWith('9')) {
    return 'BJ' + pureCode
  }
  
  // 默认归属深市 (00开头和30开头等)
  return 'SZ' + pureCode
}
