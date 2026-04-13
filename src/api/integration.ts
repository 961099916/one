import { getAPI } from './index'

export const tdxApi = {
  openStock: (symbol: string) => getAPI()?.tdx.openStock(symbol),
  getMinuteData: (params: { tdxPath: string, symbol: string, date: string, period?: string }) => getAPI()?.tdx.getMinuteData(params)
}

export const thsApi = {
  openStock: (symbol: string) => getAPI()?.ths.openStock(symbol)
}
