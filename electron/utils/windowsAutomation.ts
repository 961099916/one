import { exec } from 'child_process'
import log from 'electron-log'

/**
 * 跨进程调用工具函数：向特定的 Windows 窗口通过模拟系统原生的事件注入（Windows Forms API）
 * 发送指定的股票代码等字符串。
 * @param exePath 目标程序完整路径（不在运行时用于拉起）
 * @param code 需要发送的文本/股票代码
 * @param processName 用于检测的目标进程名（如 tdxw）
 */
export function sendTextToWindowsProcess(exePath: string, code: string, processName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const script = `
$TdxExe = "${exePath}"
$StockCode = "${code}"
Add-Type -AssemblyName System.Windows.Forms
$csharpCode = @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
Add-Type -TypeDefinition $csharpCode
$proc = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $proc) {
    if (Test-Path $TdxExe) {
        Start-Process -FilePath $TdxExe
        Start-Sleep -Seconds 6
        $proc = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Select-Object -First 1
    }
}

if ($proc -and $proc.MainWindowHandle -ne 0) {
    [Win32]::ShowWindow($proc.MainWindowHandle, 9) | Out-Null
    [Win32]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait($StockCode)
    Start-Sleep -Milliseconds 50
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
}
`
    const encodedScript = Buffer.from(script, 'utf16le').toString('base64')

    exec(`powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -EncodedCommand ${encodedScript}`, (error) => {
      if (error) {
        log.error(`[WindowsAutomation] PowerShell 执行失败: ${error.message}`)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}
