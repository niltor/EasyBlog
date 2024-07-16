
# 使用.NET Aspire Dashboard

.Net Aspire 已经进入GA，很快就出正式版本了。

其中Dashboard深受开发者的喜欢，最初只是在开发阶段提供应用数据遥测功能，但由于深受喜欢，现在也添加了更多的功能。

今天我尝试使用 Dashboard 的独立部署方式，并接入应用，以浏览实时的应用遥测数据。

## 使用docker 镜像部署独立的Dashboard

当你准备好配置文件后，直接执行如下命令即可：

```pwsh
docker run --rm -it -p 18888:18888 -p 4317:18889 -d --name aspire-dashboard -e DOTNET_DASHBOARD_CONFIG_FILE_PATH='/etc/aspire/config.json' -v ~/aspire:/etc/aspire mcr.microsoft.com/dotnet/aspire-dashboard:8.0.0
```

以上命令，使用环境变量`DOTNET_DASHBOARD_CONFIG_FILE_PATH`来告诉容器运行时去哪里寻找配置文件。

`~/aspire`是宿主机目录，`/etc/aspire`是容器内目录，我们做了一个映射。

### 配置Dashboard

我们在`~/aspire`目录下创建`config.json`文件，内容如下：

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

具体参数参考[微软官方文档](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/dashboard/configuration?tabs=bash).

这里我就讲两个重点配置：

- `BrowserToken`：这个是前端的认证token，即通过浏览器访问的时候需要输入的密码
- `PrimaryApiKey`：这个是应用程序推送监测数据时，携带的Header头中的密钥，如在.NET程序中使用`OpenTelemetry`时进行配置：

```csharp
opt.Endpoint = new Uri("http://localhost:4317");
opt.Headers = "x-otlp-api-key=PrimaryApiKey";
```

其中`opt`是`OtlpExporterOptions`类。

详细内容可参考[官方文档](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/dashboard/security-considerations?tabs=bash#secure-telemetry-endpoint).

> [!TIP]
> 如果你的配置项不多，或不喜欢使用配置文件，可以都使用环境变量的方式传入各个参数，具体参数参考官方文档。

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
