import log from 'electron-log'
import { SentimentService } from '../market/sentimentService'
import { stockPoolRepository } from '../../infrastructure/database/repositories/stockPoolRepository'

/**
 * AI 工具定义接口
 */
export interface AiTool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
  execute: (args: any) => Promise<any>
}

/**
 * 市场情绪查询工具
 */
const getMarketSentiment: AiTool = {
  name: 'get_market_sentiment',
  description: '查询最近几日的市场情绪分析，包括市场温度、连板梯队、涨跌停家数、昨日涨停赚钱效应等指标。',
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: '查询的天数，默认为 1（今天）',
        default: 1
      }
    }
  },
  async execute({ days = 1 }) {
    log.info(`[AiTools] 执行 get_market_sentiment, days: ${days}`)
    try {
      const sentimentService = SentimentService.getInstance()
      const data = await sentimentService.getSentimentCycle(days)
      return data
    } catch (err) {
      log.error('[AiTools] get_market_sentiment 失败:', err)
      return { error: '获取情绪数据失败' }
    }
  }
}

/**
 * 股票搜索工具
 */
const searchStock: AiTool = {
  name: 'search_stock',
  description: '根据名称或简称搜索股票代码，或者验证股票代码是否存在。',
  parameters: {
    type: 'object',
    properties: {
      keyword: {
        type: 'string',
        description: '股票名称关键词（如“茅台”）或简称'
      }
    },
    required: ['keyword']
  },
  async execute({ keyword }) {
    log.info(`[AiTools] 执行 search_stock, keyword: ${keyword}`)
    try {
      // 从股票池或历史记录中模糊匹配
      // 这里我们可以复用 stockPoolRepository 的模糊搜索能力，或者简单的 SQL
      const stocks = stockPoolRepository.searchStocks(keyword)
      return stocks.slice(0, 10) // 返回前10个匹配项
    } catch (err) {
      log.error('[AiTools] search_stock 失败:', err)
      return { error: '搜索股票失败' }
    }
  }
}

/**
 * 工具注册表
 */
export const aiTools: AiTool[] = [
  getMarketSentiment,
  searchStock
]

/**
 * 将工具转换为 OpenAI 格式
 */
export function getOpenAiToolsMetadata() {
  return aiTools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))
}
