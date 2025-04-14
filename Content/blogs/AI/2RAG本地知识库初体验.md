# AI本地知识库的构建

之前有分享过通过.NET Aspire在本地运行语言模型，有了这个能力后，我们就可以用它来做更多的事情，比如构建本地知识库。

## 基本知识

构建本地知识库的其中一种方式，是通过将我们的知识库数据进行向量化处理，然后存储到向量数据库中。在进行对话时，先查询我们的知识库内容，作为上下文，让语言模型获得相关知识，然后再返回给我们。

我们将了解到以下内容：

- 向量化
- 嵌入模型
- 向量化数据库
- 本地小语言模型

在代码中，我们主要借助以下接口实现相关功能

- IChatCompletionService：聊天服务
- ITextEmbeddingGenerationService：文本嵌入生成服务
- IVectorStore：向量存储服务
- IVectorStoreRecordCollection：向量存储记录集合

## 模型选择

我们需要两个模型，一个是小语言模型，用来提供自然语言处理能力，另一个是嵌入模型，用来提供向量化能力。

- phi4-mini：一个小语言模型，提供自然语言处理能力
- nomic-embed-text：一个嵌入模型，提供768维度

## 向量数据库选择

这里我们将使用`qdrant`作为向量数据库，用来存储和查询向量化后的数据。

## 使用.NET Aspire提供本地环境

我们将全部使用本地资源和实现我们的知识库，.NET Aspire提供了非常简单的方式来提供本地开发环境，我们只需要几行代码即可实现所有基础环境的搭建。

```csharp
var builder = DistributedApplication.CreateBuilder(args);
var ollama = builder.AddOllama("ollama", port: 49394)
    .WithGPUSupport()
    .WithContainerRuntimeArgs("--gpus=all")
    .WithDataVolume();

//var chat = ollama.AddModel("chat", "llama3.2:8b");
var chat = ollama.AddModel("chat", "phi4-mini");
var embed = ollama.AddModel("embed", "nomic-embed-text");

var qdrant = builder.AddQdrant("qdrant", httpPort: 49384, grpcPort: 49383)
    .WithDataVolume();

builder.AddProject<Projects.ApiService>("apiservice")
    .WithReference(chat)
    .WithReference(embed)
    .WithReference(qdrant)
    .WaitFor(chat)
    .WaitFor(embed)
    .WaitFor(qdrant);

builder.Build().Run();
```

通过以上代码，我们即可获取所有的本地环境。

需要注意的是，这里我们为`ollama`和`qdrant`设置了固定的端口，以避免每次运行时都需要重新配置端口。

## 预处理数据

基础环境已经有了，现在我们将在`ApiService`服务中来实现具体的逻辑。

要将数据存储到向量数据库中，我们需要将数据进行预处理，包括拆分和向量化。

这里我们以`markdown`文档为例，演示如何进行数据的预处理和向量化。

> [!NOTE]
> 预处理过程可以很简单，也可以很复杂，取决于你的数据本身的复杂程度。

### 创建API服务

我们将创建一个简单的API服务，用来接收数据并进行处理。以下展示我们依赖包

```xml
<PackageReference Include="Markdig" Version="0.40.0" />
<PackageReference Include="Microsoft.SemanticKernel.Connectors.Ollama" Version="1.42.0-alpha" />
<PackageReference Include="Microsoft.SemanticKernel.Connectors.Qdrant" Version="1.42.0-preview" />
<PackageReference Include="Microsoft.SemanticKernel.Core" Version="1.44.0" />
<PackageReference Include="System.Linq.AsyncEnumerable" Version="10.0.0-preview.2.25163.2" />
```

> [!TIP]
> 在当前时间点，一些包是预览版，你可以升级到最新版本，但API有可能会有变化。

> [!NOTE]
> `SemanticKernel`并不是必须的，你可以使用`CommunityToolkit.Aspire.OllamaSharp`来实现对Ollama的调用。本示例中并没有使用`SK`的核心功能。

在`Program.cs`中，我们添加相关服务并启动应用。

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddLogging(op =>
{
    op.AddSimpleConsole();
});

string? qdrantKey = builder.Configuration["Secret:QdrantKey"];
#pragma warning disable SKEXP0070
builder.Services
    .AddOllamaChatCompletion("phi4-mini",new Uri("http://localhost:49394"))
    .AddOllamaTextEmbeddingGeneration("nomic-embed-text", new Uri("http://localhost:49394"))
    .AddQdrantVectorStore("localhost", 49383, apiKey: qdrantKey);

builder.Services.AddHostedService<Worker>();
var app = builder.Build();

app.Run();
```

重点注意我们添加`chat`和`embed`时的`模型名称`和`uri地址`，要与Aspire中一致。

`qdrantKey`的密钥，我们需要在`.NET Aspire`运行起来后，在`Dashboard`对应服务的环境变化中查看。

### 文档拆分

将文本转换成向量然后进行存储，第一个问题就是，如何将文本进行拆分。

文本的拆分，可以以单词，句子，段落甚至整篇文章为单位进行向量化，其影响你搜索之后的结果。

在我们的场景中，建议使用段落或者文章为单位进行向量化。这样我们搜索的时候，能够获得更多的上下文内容，而不是单独的一个句子。

我们可以使用`markdig`类库直接将markdown文本转换成纯文本内容。

```csharp
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

    public static List<string> ToPlainText(string content)
    {
        var res = Markdown.ToPlainText(content);
        return [res];
    }
}
```

> [!NOTE]
> 文档内容的拆分，需要根据实际情况进行调整，这里没有一个标准的答案。

## 向量化存储

我们将使用`nomic-embed-text`对文本进行向量化处理，然后存储到`qdrant`中。

这个过程我们通过一个后台服务实现，创建一个`Worker`类，继承`IHostedService`接口。

### 定义存储模型

我们需要先定义要存储的数据结构，用来表示我们要存储的内容:

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

这里我们用`Guid`类型来表示主键。`Hash`用来表示文档的唯一标识，用来避免重复存储。

### 实现存储逻辑

接下来我们将在`Work`中编写向量化存储的方法:

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

然后在`StartAsync`中调用这个方法:

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
    }

    // ...省略其他代码
}
```

这里我们从配置中读取要处理的文件路径，然后获取所有的`markdown`文件，使用`Parallel.ForEachAsync`来并行处理文件。

运行程序，查看`qdrant`的`Dashboard`，确保数据已经存储成功。

## 查询向量数据

接下来我们要进行向量搜索，需要先将查询的内容进行向量化处理，然后再进行搜索。

我们可以创建一个`SearchService`类用来搜索向量数据，代码示例：

```csharp

public class SearchService
{
    private readonly ITextEmbeddingGenerationService _embed;
    private readonly IVectorStoreRecordCollection<Guid, DocumentEmbedding> _collection;
    private readonly KnowledgeProcessing _knowledgeProcessing;
    private readonly ILogger<SearchService> _logger;

    public SearchService(
        ITextEmbeddingGenerationService embed,
        IVectorStore _vectorStore,
        IConfiguration configuration,
        ILogger<SearchService> logger)
    {
        _embed = embed;
        _logger = logger;
        _collection = _vectorStore.GetCollection<Guid, DocumentEmbedding>(DocumentEmbedding.DocName);
    }

    public async Task<string[]?> SearchVectorAsync(string searchContent)
    {
        var results = Array.Empty<string>();
        var vector = await _embed.GenerateEmbeddingAsync(searchContent);
        var result = await _collection.VectorizedSearchAsync(vector, new VectorSearchOptions<DocumentEmbedding>
        {
            Top = 2,
        });
        if (await result.Results.AnyAsync())
        {
            await foreach (var item in result.Results)
            {
                if (!string.IsNullOrEmpty(item.Record.Content))
                {
                    results = [.. results, item.Record.Content];
                }
            }
        }
        return results;
    }
}
```

然后将查询结果，整合后，交给`chat`模型进行处理。

这里我们编写一个方法来接收用户的问题，在查询自己的数据后，再通过语言模型处理后，返回结果。

```csharp
public static async Task SearchAsync(
    HttpContext httpContext,
    QuestionModel question,
    IChatCompletionService chat,
    SearchService search
)
{
    httpContext.Response.ContentType = "text/plain;charset=utf-8";
    var searchResults = await search.SearchVectorAsync(question.Content);
    string searchContent = string.Empty;

    if (searchResults?.Length > 0)
    {
        foreach (var item in searchResults)
        {
            searchContent += item + Environment.NewLine;
        }
    }

    string systemPrompt = $@"
以下是从本地文档中搜索到的相关内容：
{searchContent}

仅根据上述搜索结果来回答用户的问题。如果没有足够的内容来回答，则提示没有找到相关信息。
";

    ChatHistory history = [];
    history.AddUserMessage(question.Content);
    history.AddSystemMessage(systemPrompt);

    var response = await chat.GetChatMessageContentsAsync(history);
    foreach (var item in response)
    {
        await httpContext.Response.WriteAsync(item.Content ?? "");
    }
    await httpContext.Response.CompleteAsync();
}

```

然后配置路由并调用该方法。

现在让我们来调用接口测试一下。

## 总结

现在大多数大语言模型服务都提供**搜索**功能，即通过搜索引擎接口来获取相关内容，然后交由大语言模型处理后返回结果，这样用户就可以获取到更新更准确的信息。

### 提供相关联的数据

本篇博客介绍的使用向量数据库的作用，其实也是为了提供一种搜索功能，只是使用了向量相关的相似度计算来实现。

这也意味着，向量数据库的使用并不是必须的，你可以使用如全文搜索引擎等其他方式来实现。目的就是提供与用户问题相关联的数据。这就会有很多选择，也就有很大的优化空间。

### 使用知识图谱

通过测试会发现，使用向量数据库的搜索结果并不是很准确，由于我们是按段落进行向量化存储，必然会缺失一些上下文的信息。即使我们使用整篇文章进行向量化存储，有很多"知识"是分散到不同文章中的，仍然难以获取到关联的知识内容，反而会多出一些不关联的信息，让语言模型产生`幻觉`。

所以，我们需要构建知识图谱，将知识进行关联，以便提供更准确的上下文信息。

关于这块内容，我们将在后续的博客中进行分享。
