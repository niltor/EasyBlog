# GraphRAG打造本地知识库

## 文本处理

### 准备ONNX格式的BERT模型

选择自然语言处理模型:`bert-base-multilingual-cased`，该模型支持多种语言，包括中文。

安装导出工具：

```pwsh
pip install optimum[exporters]
```

执行导出

```powershell
optimum-cli export onnx --model google-bert/bert-base-multilingual-cased mBERT/
```

> [!TIP]
> HuggingFace[参考文档](https://huggingface.co/docs/transformers/main/zh/serialization?utm_source=chatgpt.com)
