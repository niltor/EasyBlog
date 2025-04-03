# GraphRAG打造本地知识库

通过向量数据库，可以搜索我们自己的数据，然后让大语言来生成答案。但仅仅依靠向量数据库来检索数据，生成的答案效果并不理想，仍然缺乏了很多上下文信息，我们需要知识图来增强上下文信息。

## 实体识别

要想实现知识图谱的构建，我们就要能够"理解"文本内容，将其中的实体识别出来，然后构建知识图谱。

### 自然语言处理

我们需要一些模型来帮助我们完成相关的工作，由于我们需要同时处理中文和英文的文本，我们选择两个模型来处理。

中文识别我们选择[`bert-base-chinese`](https://huggingface.co/google-bert/bert-base-chinese)，它是谷歌发布的中文预训练模型，支持中文文本的处理。

英文模型我们选择[`bert-base-NER`](https://huggingface.co/dslim/bert-base-NER)。

> [!TIP]
> 经测试，多语言版本的`bert-base-multilingual-cased`模型在中文文本的处理上效果并不理想，建议使用中文的`bert-base-chinese`模型。

安装导出工具：

```pwsh
pip install optimum[exporters]
```

执行导出

```powershell

optimum-cli export onnx --model google-bert/bert-base-chinese bert_chinese/
optimum-cli export onnx --model dslim/bert-base-NER bert_base/

```

> [!TIP]
> HuggingFace[参考文档](https://huggingface.co/docs/transformers/main/zh/serialization?utm_source=chatgpt.com)
