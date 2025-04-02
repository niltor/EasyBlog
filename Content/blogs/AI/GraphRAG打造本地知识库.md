# GraphRAG打造本地知识库

通过向量数据库，可以搜索我们自己的数据，然后让大语言来生成答案。但仅仅依靠向量数据库来检索数据，生成的答案效果并不理想，仍然缺乏了很多上下文信息，我们需要知识图来增强上下文信息。

## 实体识别

要想实现知识图谱的构建，我们就要能够"理解"文本内容，将其中的实体识别出来，然后构建知识图谱。

### 自然语言处理

我们需要一些模型来帮助我们完成相关的工作。

这里我们选择模型:[`distilbert-base-multilingual-cased-mapa_coarse-ner`](https://huggingface.co/dmargutierrez/distilbert-base-multilingual-cased-mapa_coarse-ner)，该模型是基于谷歌的`bert-base-multilingual-cased`模型微调的，更方便我们的使用。

安装导出工具：

```pwsh
pip install optimum[exporters]
```

执行导出

```powershell
optimum-cli export onnx --model dmargutierrez/distilbert-base-multilingual-cased-mapa_coarse-ner mBERT/
```

> [!TIP]
> HuggingFace[参考文档](https://huggingface.co/docs/transformers/main/zh/serialization?utm_source=chatgpt.com)
