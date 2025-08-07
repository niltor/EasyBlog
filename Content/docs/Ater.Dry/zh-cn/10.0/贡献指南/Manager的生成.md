# Manager的生成

Manager是实现业务逻辑的核心组件，通常用于处理数据访问和业务逻辑。它们可以通过继承`ManagerBase`类来实现。

Manager是通过实体进行生成的，通过解析实体，获取相关信息，然后生成Manager类。

## ManagerBase

所有Manager都需要继承`ManagerBase`类，不继承的不会通过源代码生成器注入服务。模板提供了以下几种ManagerBase:

- `ManagerBase<TDbContext, TEntity>(TDbContext dbContext, ILogger logger)`：用于指定数据库上下文和实体。

- `ManagerBase(ILogger logger)`，不指定数据库上下文和实体，可自由注册自己需要的服务。

## 生成逻辑

- 解析指定的实体类`Entity`
- 解析所有继承`ContextBase`的`DbContext`
  - 获取`Entity`所在的`DbContext`，如果有多个取第一个