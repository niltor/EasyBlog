# Controllers 的生成

## 概述

选择实体然后生成Controller，由于Controller依赖`Dto`和`Manager`，所以会先生成`Dto`和`Manager`。


生成的Controller默认继承`RestControllerBase<TManager>`，

```csharp
[ApiExplorerSettings(GroupName = "v1")]
[Authorize(Policy = WebConst.User)]
public class RestControllerBase<TManager>(
    Localizer localizer,
    TManager manager,
    IUserContext user,
    ILogger logger
) : RestControllerBase(localizer)
    where TManager : class
{
    protected readonly TManager _manager = manager;
    protected readonly ILogger _logger = logger;
    protected readonly IUserContext _user = user;
}
```

## 其他

唯一索引可用来默认判断唯一性