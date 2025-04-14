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

完整的`KnowledgeProcessing`类

```csharp
/// <summary>
/// 知识内容处理
/// </summary>
public class KnowledgeProcessing
{
    private readonly IChatCompletionService _chat;
    private readonly ILogger<KnowledgeProcessing> _logger;

    public KnowledgeProcessing(IChatCompletionService chat, ILogger<KnowledgeProcessing> logger)
    {
        _chat = chat;
        _logger = logger;
    }

    /// <summary>
    /// 实体识别
    /// </summary>
    /// <param name="text"></param>
    /// <param name="chat"></param>
    /// <returns></returns>
    public async Task<NerResultDto?> NerAsync(string text)
    {
        string prompt = $$"""
            {{text}}
            请分析该句子，识别其中的内容，以便进行分类
            要识别的类别为: 技术名词，专有名词，摘要；识别的内容保持原语言表示

            要求返回的json格式如下：{
                "TechNoun":["",""],
                "ProperNoun":["",""]，
                "Summary":""
            }

            返回内容严格遵循json格式，是合法的JSON，不能有其他内容。请注意，json的键名必须与上面一致，值可以是空数组或空字符串。
            """;
        var response = await _chat.GetChatMessageContentsAsync(prompt);

        var result = response.FirstOrDefault()?.Content;

        if (result != null)
        {
            result = MarkdownProcessing.RemoveCodeBlock(result, "json");
            try
            {
                return JsonSerializer.Deserialize<NerResultDto>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NerAsync error: {result}", result);
            }
        }
        return null;
    }

    /// <summary>
    /// 关系抽取
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    public async Task<List<RelationDto>?> RelationExtractionAsync(string text)
    {
        string prompt = $$"""
            请分析以下文本内容，识别其中的技术名词、专有名词和概念等，并提取它们之间的关系。

            如果文本中包含多个关系，请提取所有关系。如"属于","包含","依赖于"等关系
            
            将结果以 JSON 数组的形式输出，每个元素包含 "Subject" (实体1), "Relation" (关系), 和 "Target" (实体2) 字段。如果没有对应的Target，则不要返回该元素。

            返回的json格式如下：[
            {"Subject":"","Relation":"","Target":""}
            ]

            返回内容严格遵循json格式，是合法的JSON，不能有其他内容。请注意，json的键名必须与上面一致，值可以是空数组或空字符串。

            文本内容：
            {{text}}
            """;
        var response = await _chat.GetChatMessageContentsAsync(prompt);
        var result = response.FirstOrDefault()?.Content;
        if (result != null)
        {
            result = MarkdownProcessing.RemoveCodeBlock(result, "json");
            try
            {
                return JsonSerializer.Deserialize<List<RelationDto>>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NerAsync error: {result}", result);
            }
        }
        return null;
    }
}
```

## 知识图谱的存储及查询

现在我们知道了如何提取实体关系，现在我们要将这些信息存储起来，以便后续使用。

实体关系我们使用`RelationDto`来表示，它是一个列表，我们完全可以将它转变成Json，然后存储到本地。

为了能够查询实体关系，我们需要加载这些数据，然后转变成图的结构，然后进行查询。

### 知识图谱的结构和查询

我们可以将知识图谱存储到文件中，然后在使用时加载到内存中，我们可以使用`QuikGraph`来实现图的加载和查询。

```csharp
/// <summary>
/// 图结构存储和处理关系数据
/// </summary>
public static class GraphDataProcessing
{
    private readonly static BidirectionalGraph<string, RelationEdge> Graph = new();

    public static void AddRelation(RelationDto relation)
    {
        if (!Graph.ContainsVertex(relation.Subject))
        {
            Graph.AddVertex(relation.Subject);
        }
        if (!Graph.ContainsVertex(relation.Target))
        {
            Graph.AddVertex(relation.Target);
        }
        Graph.AddEdge(new RelationEdge(relation.Subject, relation.Target, relation.Relation));
    }

    public static IEnumerable<RelationDto> QueryRelations(string subject, string target)
    {
        return Graph.Edges
            .Where(edge => edge.Source == subject || edge.Target == target)
            .Select(edge => new RelationDto
            {
                Subject = edge.Source,
                Relation = edge.Relation,
                Target = edge.Target
            });
    }
}
public class RelationEdge : Edge<string>
{
    public string Relation { get; }

    public RelationEdge(string source, string target, string relation)
        : base(source, target)
    {
        Relation = relation;
    }
}

```

## 准备数据

现在我们已经了解了关键的概念和实现方式，接下来我们需要准备数据。我们需要：

1. 将现有数据拆分，然后进行向量化处理，存储到向量数据库中。
2. 将数据拆分，进行实体关系识别，然后存储到本地文件中。

这里我以`markdown`文档为例子。

### 向量化数据

这次，我们将文本拆分成段落，然后进行向量化处理。

```csharp
using Markdig;

namespace ApiService.Processing;

/// <summary>
/// markdown文档处理
/// </summary>
public class MarkdownProcessing
{
    /// <summary>
    /// 按二级标题拆分
    /// </summary>
    /// <param name="content"></param>
    /// <returns></returns>
    public static List<string> SplitText(string content)
    {
        // 拆分
        var paragraphs = content.Split("\n## ", StringSplitOptions.RemoveEmptyEntries).ToList();
        return paragraphs.Select(s => Markdown.ToPlainText(s)).ToList();
    }
}
```

然后我们借助Ollama本地模型`nomic-embed-text`进行向量化处理，存储到`qdrant`中。

先定义向量存储模型

```csharp
public class DocumentEmbedding
{
    public static string DocName = "dusi";

    [VectorStoreRecordKey]
    public Guid Id { get; set; } = Guid.NewGuid();

    [VectorStoreRecordData]
    public string Hash { get; set; } = string.Empty;

    [VectorStoreRecordData]
    public string Content { get; set; } = string.Empty;

    [VectorStoreRecordVector(768)]
    public ReadOnlyMemory<float>? DescriptionEmbedding { get; set; }

    [VectorStoreRecordData(IsFilterable = true)]
    public List<string> Tags { get; set; } = [];
}
```

然后编写向量化存储的代码：

```csharp
/// <summary>
/// 向量化存储
/// </summary>
/// <param name="content"></param>
/// <returns></returns>
private async Task EmbedAndSaveAsync(IVectorStoreRecordCollection<Guid, DocumentEmbedding> collection, string content)
{
    var paragraph = MarkdownProcessing.SplitText(content);

    var hash = MD5.HashData(Encoding.UTF8.GetBytes(content));
    var md5 = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

    ReadOnlyMemory<float> zeroVector = new float[768];

    var searchResult = await collection.VectorizedSearchAsync(zeroVector, new VectorSearchOptions<DocumentEmbedding>
    {
        Filter = d => d.Hash == md5,
        Top = 1
    });
    if (await searchResult.Results.AnyAsync())
    {
        _logger.LogInformation("➡️ skip exist embed...{name}", md5);
        return;
    }
    var embeddings = await _embed.GenerateEmbeddingsAsync(paragraph);

    List<DocumentEmbedding> sentencesEmbeddings = [];
    for (int i = 0; i < embeddings.Count; i++)
    {
        sentencesEmbeddings.Add(new DocumentEmbedding
        {
            Hash = md5,
            Content = paragraph[i],
            DescriptionEmbedding = embeddings[i]
        });
    }
    try
    {
        if (sentencesEmbeddings.Count > 0)
        {
            var embedRes = collection.UpsertBatchAsync(sentencesEmbeddings);
            await foreach (var item in embedRes)
            {
            }
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error during upsert");
    }
}
```

`collection`的创建如下

```csharp
 var collection = _vectorStore.GetCollection<Guid, DocumentEmbedding>(DocumentEmbedding.DocName);
 await collection.CreateCollectionIfNotExistsAsync();
```

其中的`_embed`是注入的`ITextEmbeddingGenerationService`接口，`_vectorStore`是注入的`IVectorStore`接口。

### 生成知识图谱数据

先定义知识图谱数据存储结构

```csharp
public class KnowledgeGraphDto
{
    public HashSet<string> HashSet { get; set; } = [];
    public List<RelationDto> RelationDtos { get; set; } = [];
}
```

其中HashSet用来避免重复处理相同的数据。

然后我们编写一个获取知识图谱数据的方法:

```csharp
/// <summary>
/// 知识图谱
/// </summary>
/// <param name="content"></param>
/// <returns></returns>
private async Task GraphKnowledgeAsync(string content, KnowledgeGraphDto knowledgeGraph)
{

    var paragraph = MarkdownProcessing.SplitText(content);
    using (var scope = serviceProvider.CreateScope())
    {
        var processing = scope.ServiceProvider.GetRequiredService<KnowledgeProcessing>();

        var relationList = new List<RelationDto>();

        foreach (var text in paragraph)
        {
            var md5 = MD5.HashData(Encoding.UTF8.GetBytes(content));
            var hash = BitConverter.ToString(md5).Replace("-", "").ToLowerInvariant();

            if (knowledgeGraph.HashSet.TryGetValue(hash, out string? val))
            {
                _logger.LogInformation("➡️ skip exist graph...{name}", hash);
                continue;
            }

            var relation = await processing.RelationExtractionAsync(text);
            if (relation != null)
            {
                relationList.AddRange(relation);
                knowledgeGraph.HashSet.Add(hash);
            }
        }
        knowledgeGraph.RelationDtos.AddRange(relationList);
    }
}
```

### 后台任务处理代码

我们使用后台服务(`IHostedService`)来完成以上流程，

```csharp
public class Worker(
    ILogger<Worker> _logger,
    ITextEmbeddingGenerationService _embed,
    IVectorStore _vectorStore,
    IConfiguration configuration,
    IServiceProvider serviceProvider
    ) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var searchPath = configuration["Resources:ContentPath"];

        if (string.IsNullOrWhiteSpace(searchPath))
        {
            _logger.LogError("Search path is not configured.");
            return;
        }

        _logger.LogInformation("✨ start embed content from {path}", searchPath);
        var collection = _vectorStore.GetCollection<Guid, DocumentEmbedding>(DocumentEmbedding.DocName);
        await collection.CreateCollectionIfNotExistsAsync();
        var mdFiles = Directory.GetFiles(searchPath, "*.md", SearchOption.AllDirectories);

        var parallelOptions = new ParallelOptions
        {
            MaxDegreeOfParallelism = 4, // Specify the desired number of threads
            CancellationToken = cancellationToken
        };
        await Parallel.ForEachAsync(mdFiles, parallelOptions, async (mdFile, ct) =>
        {
            var mdContent = File.ReadAllText(mdFile);
            await EmbedAndSaveAsync(collection, mdContent);
            _logger.LogInformation("🆕 [{number}] Embedded!", mdFile);
        });
        _logger.LogInformation("✅ All files embedded!");

        // 知识图谱
        _logger.LogInformation("✨ start graph knowledge from {path}", searchPath);
        var dataPath = configuration["Resources:DataPath"];
        if (dataPath == null)
        {
            _logger.LogError("dataPath is null");
            return;
        }

        var dataFilePath = Path.Combine(dataPath, "knowledge.json");
        var knowledgeGraph = new KnowledgeGraphDto();
        if (File.Exists(dataFilePath))
        {
            var jsonContent = await File.ReadAllTextAsync(dataFilePath);
            knowledgeGraph = JsonSerializer.Deserialize<KnowledgeGraphDto>(jsonContent);
        }
        await Parallel.ForEachAsync(mdFiles, parallelOptions, async (mdFile, ct) =>
        {
            var mdContent = File.ReadAllText(mdFile);
            await GraphKnowledgeAsync(mdContent, knowledgeGraph);
            _logger.LogInformation("🆕 Got Knowledge:[{number}]", mdFile);
        });
        _logger.LogInformation("✅ All files graph knowledge!");

        // save knowledge graph
        var json = JsonSerializer.Serialize(knowledgeGraph);
        await File.WriteAllTextAsync(dataFilePath, json);
        _logger.LogInformation("✅ Save knowledge graph to {path}", dataFilePath);
    }
    // ...以上具体处理的方法代码
}
```

> [!NOTE]
> 数据处理是一个耗时的过程，我们可以使用控制台程序或者后台服务来进行处理。
>
> 避免重复处理相同的数据。

## 查询流程

现在我们有以下信息：

- 向量化后的数据
- 知识图谱数据

然后我们要先梳理下查询流程，用户登录是询问一个问题，我们要进行以下操作：

1. 向量化用户问题，查询向量数据库，获取相关数据:Result1
2. 对用户问题进行实体识别，获取相关实体
3. 将识别出的实体与知识图谱进行匹配，获取相关关系
4. 将关系转换成向量化数据，查询向量数据库，获取相关数据:Result2
5. 将Result1和Result2进行合并，然后通过大语言模型生成最终答案。

> [!IMPORTANT]
> 这个流程不是固定的，是需要根据实际情况来调整的。

> [!TIP]
> 完整的[项目源码示例](https://github.com/niltor/RAGSample).
