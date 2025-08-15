# Manager的生成

Manager是实现业务逻辑的核心组件，通常用于处理数据访问和业务逻辑。它们可以通过继承`ManagerBase`类来实现。

Manager是通过实体进行生成的，通过解析实体，获取相关信息，然后生成Manager类。

## ManagerBase

所有Manager都需要继承`ManagerBase`类，不继承的不会通过源代码生成器注入服务。模板提供了以下几种ManagerBase:

- `ManagerBase<TDbContext, TEntity>(TDbContext dbContext, ILogger logger)`：用于指定数据库上下文和实体。

- `ManagerBase(ILogger logger)`，不指定数据库上下文和实体，可自由注册自己需要的服务。

## 生成逻辑

- 解析指定的实体类`Entity`
- 获取继承`DbContext`的抽象基类。
- 解析所有继承抽象基类的`DbContext`实现类。
  - 获取`Entity`所在的`DbContext`，如果有多个则取第一个，作为生成时的`TDbContext`
- 生成Manager类
  - 将获取到的实现类作为泛型参数`TDbContext`
  - 如果有关联的
  
## 常规方法

为了更好的说明，我们在一个实际场景下进行说明。

比如，现有`User/Catalog/Blog`三个实体类，用户可以有多个Catalog，Catalog可以有多个Blog。Catalog本身是树型结构，可以有多层。

现在我们来生成添加`Blog`的逻辑，我们尽可能将该操作流程化：


## 额外方法


```csharp
public async Task<bool> IsOwnedAsync(Guid id, Guid userId)
{
    return await Queryable.AnyAsync(q => q.Id == id && q.User.Id == userId);
}
```

```csharp
public async Task<Blog?> GetOwnedAsync(Guid id, Guid userId)
{
    var query = _dbSet.Where(q => q.Id == id);
    query = query.Where(q => q.UserId == userId);
    return await query.FirstOrDefaultAsync();
}

public async Task<bool> IsValidateCatalogAsync(Guid catalogId, Guid userId)
{
    return await _dbContext
        .Set<Catalog>()
        .Where(q => q.Id == catalogId && q.UserId == userId)
        .AnyAsync();
}
```



Controller

```csharp
[HttpPost]
public async Task<ActionResult<Guid?>> AddAsync(BlogAddDto dto)
{
    if(!await _manager.IsValidateCatalogAsync(dto.CatalogId,_user.UserId))
    {
        return NotFound(Localizer.NotFoundResource);
    }

    var id = await _manager.AddAsync(dto);
    return id == null ? Problem(Localizer.AddFailed) : id;
}

```
