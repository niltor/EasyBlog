# MCP Server

10.0 版本提供了MCP Server，这意味着你可以在IDE中，添加我们的MCP Server，然后通过它来生成代码。

## 启动MCP Server

首先，通过`ater studio`命令启用MCP Server。

## 添加MCP Server到IDE

你可以在支持MCP的IDE中添加我们的MCP Server，内容示例:

```json
{
  "servers": {
    "ater.copilot": {
      "url": "http://localhost:19016/mcp",
      "type": "http"
    }
  }
}
```

## 使用MCP Server

你可以勾选你需要的工具列表，目前内置提供了以下功能：

- 创建新实体
- 生成dto
- 生成manager
- 生成controller
- 添加新模块
- 添加新服务
- 生成前端请求服务

详细使用方法，可参考[内置工具使用示例](./代码生成/MCP生成/内置工具使用示例.md)。


> [!TIP]
> 如果你需要自定义工具，可以参考[自定义工具](./代码生成/MCP生成/自定义工具.md)。