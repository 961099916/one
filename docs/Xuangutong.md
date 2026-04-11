# 选股通接口
## 获取市场涨跌数
### URL
https://flash-api.xuangubao.com.cn/api/market_indicator/line?fields=rise_count,fall_count&date=2026-04-10
### 参数
date为要查询的日期
### 响应
```json
{
    "code": 20000,
    "message": "OK",
    "data": [
        {
            "fall_count": 1316,
            "rise_count": 3743,
            "timestamp": 1775804220
        },
        {
            "fall_count": 1316,
            "rise_count": 3743,
            "timestamp": 1775804280
        },
        {
            "fall_count": 1316,
            "rise_count": 3743,
            "timestamp": 1775804340
        },
        {
            "fall_count": 1362,
            "rise_count": 3709,
            "timestamp": 1775804400
        }
    ]
}
```
如果当天未开盘，则返回空数组 或者 timestamp 和当前日期不对应