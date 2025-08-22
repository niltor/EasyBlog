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

> [!TIP]
> 控制器默认有一个Manager泛型，当需要多个`Manager`时，可自行注入`Manager`，然后在Controller中使用。

## 生成逻辑

controller的生成需要先获取以下信息

- 通过`DbContextParseHelper`解析指定的实体类`Entity`，最终获取`EntityInfo`对象。
- 用户选择的服务项目，判断是否引用了`SystemMod`(可配置)，以便区分是否具有管理权限。
- 前置步骤生成的`Dto`的信息，通过缓存获取
- 解决方案配置信息
  
接口的生成，主要是通过调用`Manager`的相关方法来实现。根据`RestApi`的规范，生成的接口方法包括：

- 分页查询
- 新增
- 更新
- 获取详情
- 删除

## 分页查询

```csharp
/// <summary>
/// 分页数据 🛑
/// </summary>
/// <param name="filter"></param>
/// <returns></returns>
[HttpPost("filter")]
public async Task<ActionResult<PageList<BlogItemDto>>> FilterAsync(BlogFilterDto filter)
{

    filter.UserId = _user.UserId;
    return await _manager.ToPageAsync(filter);
}

/// <summary>
/// 新增 🛑
/// </summary>
/// <param name="dto"></param>
/// <returns></returns>
[HttpPost]
public async Task<ActionResult<Guid?>> AddAsync(BlogAddDto dto)
{
    if (!await _manager.IsValidateCatalogAsync(dto.CatalogId, _user.UserId))
    {
        return NotFound(Localizer.NotFoundResource);
    }
    dto.UserId = _user.UserId;
    var id = await _manager.AddAsync(dto);
    return id == null ? Problem(Localizer.AddFailed) : id;
}

/// <summary>
/// 更新数据 🛑
/// </summary>
/// <param name="id"></param>
/// <param name="dto"></param>
/// <returns></returns>
[HttpPatch("{id}")]
public async Task<ActionResult<bool>> UpdateAsync([FromRoute] Guid id, BlogUpdateDto dto)
{
    var entity = await _manager.GetOwnedAsync(id, _user.UserId);
    if (entity == null)
    {
        return NotFound(Localizer.NotFoundResource);
    }

    return await _manager.UpdateAsync(entity, dto);
}

/// <summary>
/// 获取详情 🛑
/// </summary>
/// <param name="id"></param>
/// <returns></returns>
[HttpGet("{id}")]
public async Task<ActionResult<BlogDetailDto?>> GetDetailAsync([FromRoute] Guid id)
{
    if (!await _manager.IsOwnedAsync(id, _user.UserId))
    {
        return NotFound(Localizer.NotFoundResource);
    }
    var res = await _manager.GetDetailAsync(id);
    return res == null ? NotFound() : res;
}

/// <summary>
/// 删除 🛑
/// </summary>
/// <param name="id"></param>
/// <returns></returns>
[HttpDelete("{id}")]
public async Task<ActionResult<bool>> DeleteAsync([FromRoute] Guid id)
{
    // 注意删除权限
    if (!await _manager.IsOwnedAsync(id, _user.UserId))
    {
        return NotFound(Localizer.NotFoundResource);
    }
    // return Forbid();
    return await _manager.DeleteAsync([id], true);
}

```