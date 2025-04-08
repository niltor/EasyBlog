# 使用语言模型构建自己的知识库

通过向量数据库，可以搜索我们自己的数据，然后让大语言来生成答案。但仅仅依靠向量数据库来检索数据，生成的答案效果并不理想，仍然缺乏了很多上下文信息，我们需要更多的方法来增强上下文信息。

## 实体识别

要想实现知识图谱的构建，我们就要能够"理解"文本内容，将其中的"关键"信息提取出来 ，然后构建知识图谱。

我们将借助小语言模型或大语言模型来实现这一目标。

> [!TIP]
> 你也可以使用自然语言处理的模型来训练自己的模型，然后使用模型来进行实体识别。
> 但是，这可能费时费力，效果也未必理想。

### 定义识别的结构

请根据自己的需求来定义识别的结构，如我需要识别技术名词、专有名词、摘要等信息。

```csharp
public class NerResultDto
{
    /// <summary>
    /// 技术名词
    /// </summary>
    public string[]? TechNoun { get; set; }
    /// <summary>
    /// 专有名词
    /// </summary>
    public string[]? ProperNoun { get; set; }

    /// <summary>
    /// 摘要
    /// </summary>
    public string? Summary { get; set; }
}
```

然后我们将使用语言模型能力提取实体信息，如：

```csharp
string prompt = $$"""
    {{text}}
    请分析该句子，识别其中的内容，以便进行分类
    要识别的类别为: 技术名词，专有名词，摘要；识别的内容保持原语言表示
    返回的json格式如下：{
        "TechNoun":["",""],
        "ProperNoun":["",""]，
        "Summary":""
    }
    仅返回json本身内容作为最终结果，不需要任何格式化内容，不要添加解释。
    """;
```

## 关系抽取

### 定义关系抽取的结构

我们需要定义关系抽取的结构，如我需要识别实体之间的关系。

```csharp
public class RelationDto
{
    public required string Subject { get; set; }
    public required string Relation { get; set; }
    public required string Target { get; set; }
}
```

提示词如：

```csharp
string prompt = $$"""
    请分析以下文本内容，识别其中的技术名词、专有名词和概念等，并提取它们之间的关系。

    如果文本中包含多个关系，请提取所有关系。如"属于","包含","依赖于"等关系
    
    将结果以 JSON 数组的形式输出，每个元素包含 "subject" (实体1), "relation" (关系), 和 "target" (实体2) 字段。
    返回的json格式如下：[
    {"subject":"","relation":"","target":""}
    ]

    仅返回json本身内容作为最终结果，不需要任何格式化内容，不要添加解释。

    文本内容：
    {{text}}
    """;
```

## 知识图谱的存储及查询

### 存储知识图谱

我们可以将知识图谱存储到文件中，然后在使用时加载到内存中，使用`QuickGraph`来实现图的加载和查询。


### 查询知识图谱
