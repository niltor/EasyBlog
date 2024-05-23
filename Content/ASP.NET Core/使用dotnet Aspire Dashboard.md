
# 使用.NET Aspire Dashboard

.Net Aspire 已经进入GA，很快就出正式版本了。

其中Dashboard深受开发者的喜欢，最初只是在开发阶段提供应用数据遥测功能，但由于深受喜欢，现在也添加了更多的功能。

今天我尝试使用 Dashboard 的独立部署方式，并接入应用，以浏览实时的应用遥测数据。

## 使用docker 镜像部署独立的Dashboard

```dockerfile

docker run --rm -it -p 18888:18888 -p 4317:18889 -d --name aspire-dashboard -e DOTNET_DASHBOARD_CONFIG_FILE_PATH='/etc/aspire/config.json' -v ~/aspire:/etc/aspire mcr.microsoft.com/dotnet/aspire-dashboard:8.0.0

```

如果我们想在公网访问，那么安全性就非常重要，我们需要配置一下:

```json
{
  "Dashboard": {
    "TelemetryLimits": {
      "MaxLogCount": 2000,
      "MaxTraceCount": 1000,
      "MaxMetricsCount": 1000
    },
    "Frontend": {
      "AuthMode":"BrowserToken",
      "BrowserToken":""
    },
    "Otel": {
      "AuthMode": "ApiKey",
      "PrimaryApiKey": ""
    }
  }
}
```

## 问题

如果你无法正常拉取微软官方的镜像，请尝试修改dns，如在`/etc/resolv.conf`中添加:

```conf
nameserver 8.8.8.8
nameserver 8.8.4.4
```

使用nslookup 命令验证dns

```bash
nslookup mcr.microsoft.com
```
