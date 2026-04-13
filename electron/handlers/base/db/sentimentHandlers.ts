import { ipcMain } from 'electron'
import { SentimentService } from '../../../services/market/sentimentService'
import { IpcChannel } from '@common/constants'
import log from 'electron-log'

export function initSentimentHandlers(): void {
  ipcMain.handle(IpcChannel.DB_GET_SENTIMENT_CYCLE, (_event, { limit }) => {
    try {
      return SentimentService.getInstance().getSentimentCycle(limit)
    } catch (err) {
      log.error('[DB IPC] get-sentiment-cycle 失败:', err)
      throw err
    }
  })
}
