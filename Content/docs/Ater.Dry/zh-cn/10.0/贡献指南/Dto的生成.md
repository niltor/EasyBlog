# DTO的生成

Dto用来定义接口的输入输出数据结构，当与数据库进行交互时，需要进行类型的转换。

我们使用`Mapper`来进行实体类与DTO之间的转换。Dto的内容是根据实体类生成的，这是前置的条件。

本篇文档内容会介绍如何生成DTO类以及DTO的生成规则。

## 生成的DTO类

根据**实体类**生成DTO类，包括：

| Dto       | 作用             |
| --------- | ---------------- |
| ItemDto   | 列表元素         |
| DetailDto | 某实体的详情     |
| FilterDto | 请求筛选条件模型 |
| AddDto    | 添加时的模型     |
| UpdateDto | 更新时的模型     |

在生成Dto时，会将Dto信息存储到缓存，当生成任务结束后，会清理缓存。

## DTO生成规则

DTO全局忽略以下属性(暂不支持处理)：

- 属性含有[JsonIgnore]特性时
- 属性类型为`JsonDocument`或`byte[]`时

后续我们会针对这些属性进行处理。

> [!TIP]
> 由于我们使用`EntityFrameworkCore.Design`来获取实体信息，那些不被认为是数据库映射的属性，在生成添加/修改Dto时，不会包含这些属性。
>

对于每种DTO，会根据具体的使用场景进行属性的筛选和处理。

## AddDto

添加模型生成内容如下：

- 忽略 "Id", "CreatedTime", "UpdatedTime", "IsDeleted"等基础属性
- 必须是可赋值的属性，即有`set`方法。
- 不再保留原`required`关键词限制，以便更好的创建实例。
- 对于导航属性，会进行以下处理：
  - 忽略Collection && SkipNavigation导航属性

## ItemDto

列表元素不会包括以下属性：

- IsDeleted与UpdatedTime字段，但会包含CreatedTime
- 数组或列表
- 长度大于200的字符串
- 导航属性及对应Id

## DetailDto

详情Dto不包含以下属性：

- IsDeleted
- 列表和导航属性
- `JsonDocument`与`byte[]`类型的属性

## FilterDto

FilterDto生成内容如下：

- 忽略 "Id", "CreatedTime", "UpdatedTime", "IsDeleted"等基础属性
- 忽略列表及导航属性
- 忽略最大长度在于1000的字符串属性
- 保留必需属性(但不为导航属性)
- 包括枚举属性

## UpdateDto

更新模型生成内容同添加模型，但是更新模型所有属性默认都为可空属性。

可空属性，意味着，如果该字段为空，更新时，会忽略该字段，以此来实现部分更新。