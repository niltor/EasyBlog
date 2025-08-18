# Manager的生成

Manager是实现业务逻辑的核心组件，通常用于处理数据访问和业务逻辑。它们可以通过继承`ManagerBase`类来实现。

Manager是通过实体进行生成的，通过解析实体，获取相关信息，然后生成Manager类。

## ManagerBase

所有Manager都需要继承`ManagerBase`类，不继承的不会通过源代码生成器注入服务。模板提供了以下几种ManagerBase:

- `ManagerBase<TDbContext, TEntity>(TDbContext dbContext, ILogger logger)`：用于指定数据库上下文和实体。

- `ManagerBase(ILogger logger)`，不指定数据库上下文和实体，可自由注册自己需要的服务。

## 生成逻辑

- 通过`DbContextParseHelper`解析指定的实体类`Entity`，最终获取`EntityInfo`对象。
- 生成Manager类
  - 将实体所属DbContext实现类作为泛型参数`TDbContext`
  - 实体的模模块特性，用来确定`Manager`生成时的模块目录
  
## 常规方法

为了更好的说明，我们在一个实际场景下进行说明。

比如，现有`User/Catalog/Blog`三个实体类，用户可以有多个Catalog，Catalog可以有多个Blog。Catalog本身是树型结构，可以有多层。

对于一个实体，会生成通用的的方法:

```csharp
public async Task<Guid?> AddAsync(BlogAddDto dto)
{
    var entity = dto.MapTo<Blog>();
    // add other logic
    return await base.AddAsync(entity) ? entity.Id : null;
}

public async Task<bool> UpdateAsync(Blog entity, BlogUpdateDto dto)
{
    entity.Merge(dto);
    // add other logic
    return await base.UpdateAsync(entity);
}

public async Task<BlogDetailDto?> GetDetailAsync(Guid id)
{
    return await FindAsync<BlogDetailDto>(e => e.Id == id);
}

public async Task<bool> HasConflictAsync(string unique, Guid? id = null)
{
    // custom unique check
    return await _dbSet
        .Where(q => q.Id.ToString() == unique)
        .WhereNotNull(id, q => q.Id != id)
        .AnyAsync();
}

public new async Task<bool?> DeleteAsync(List<Guid> ids, bool softDelete = true)
{
    return await base.DeleteAsync(ids, softDelete);
}
```

以上方法依次为：添加/修改/获取详情/检查唯一性/删除。

> [!CAUTION]
> 其中唯一性判断尝试根据唯一索引进行判断，如果没有唯一索引，则需要自行实现。

## 额外方法

额外方法，是指根据实体关系的分析，生成的额外方法，以便在控制器中使用。

```csharp
/// <summary>
/// get owned Blog
/// </summary>
public async Task<Blog?> GetOwnedAsync(Guid id, Guid userId)
{
    var query = _dbSet.Where(q => q.Id == id);
    query = query.Where(q => q.UserId == userId);

    return await query.FirstOrDefaultAsync();
}

/// <summary>
/// has Blog
/// </summary>
public async Task<bool> IsOwnedAsync(Guid id, Guid userId)
{
    return await Queryable.AnyAsync(q => q.Id == id && q.UserId == userId);
}

/// <summary>
/// validate Catalog owned by user
/// </summary>
public async Task<bool> IsValidateCatalogAsync(Guid catalogId, Guid userId)
{
    return await _dbContext
        .Set<Catalog>()
        .Where(q => q.Id == catalogId && q.UserId == userId)
        .AnyAsync();
}
```

## 分页查询处理




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
