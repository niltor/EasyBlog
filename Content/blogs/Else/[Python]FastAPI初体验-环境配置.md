# FastAPI 初体验 - 环境配置

最新有个简单的契机，让我再次尝试使用Python。于是想要做一个简单的功能验证，就是使用一个Web框架跑通查询数据和返回数据的流程。

另外，也是想看一下现在的Python的整体开发体验有没有什么变化。

## 技术选型

在开始之前，我简单了解了一下Python最新的一些技术栈，得到了两个关键词：

- uv：命令行工具，采用rust编写，可用来创建项目，管理Python的虚拟环境以及软件包。
- FastAPI：用来开发API的Web框架，基于uvicorn和Starlette，支持异步IO。支持较新的Python版本。
- PyCharm：用来开发和测试Python程序的IDE。

这两个"新"的东西，说明了Python生态仍然在基础工具和框架上在不断改进，证实了之前相关技术的“落后”性。

当然，一些恶心开发者的东西仍然存在，比如虚拟环境。

## 环境配置

说实话，直到今天，想要把Python环境搭建起来，其成本还是比其他语言要高。尤其是你需要先了解虚拟环境的概念。

下面我们来一步一步把环境和工具搭建起来。

### 安装 Python

首先，我们需要安装 Python。可以从 [Python 官网](https://www.python.org/downloads/) 下载最新版本的 Python。

### 安装 uv

要了解这是开源社区提供的工具，不是官方提供的。用它来管理Python的虚拟环境和包，是当前的主流做法。毕竟官方并没有提供良好的工具体验。

uv提供了很多种安装方式，这里我使用`winget`来安装。

```pwsh
winget install --id=astral-sh.uv  -e
```

安装完成后，重启终端，然后输入`uv`，可以看到相关的帮助信息。

> [!TIP]
> Winget是Windows下的包管理工具。请参考uv完整的[安装文档](https://docs.astral.sh/uv/getting-started/installation/).

### 安装PyCharm

这里我使用的是`PyCharm`，我们可以下载社区版。

使用IDE的目的之一是，我不想每次手动激活和即出虚拟环境💀(人生苦短，我用Python，感觉更像是讽刺)。

## 创建项目

基础环境和工具安装完了，接下来我们就可以创建项目了。

我们使用`uv`来创建项目

```pwsh
uv init TestSrvice
```

这样我们会在TestService目录下创建项目。

## 配置项目

我们使用`PyCharm`来编辑和管理项目，启动`PyCharm`，选择打开项目，找到`TestService`目录。

`PyCharm`应该会自动识别并配置uv为项目解释器。

现在我们点击运行，看下输出，测试运行`main.py`文件的结果。

### 使用FastAPI

要想使用FastAPI框架开发接口，我们需要安装相关的包。

我们在IDE中找到Python软件包，然后搜索`fastapi`，点击安装。

修改`main.py`文件，添加FastAPI的相关代码。

```python
from typing import Union
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
```

现在我们不是要运行`main.py`文件脚本了，而是要通过web服务器将API服务运行起来，所以我们需要进行配置。

### 配置运行项目

在`PyCharm`中FastAPI项目将使用`Uvicorn`作为web服务器，我们需要安装`uvicorn`。

- 在IDE中找到Python软件包，然后搜索`uvicorn`，点击安装。
- 在`PyCharm`中选择`运行`菜单，然后选择`编辑配置`，然后点击`+`号，选择`FastAPI`。
- 应用程序文件，选择`main.py`文件，其它保持默认，保存配置。
- 点击运行按钮，运行项目。

程序运行起来后，我们查看`http://127.0.0.1:8000/`以及`http://127.0.0.1:8000/docs`，以验证API是否正常工作。

> [!TIP]
> 如果不在IDE中运行和调试，FastAPI提供了`dev`和`run`命令来运行程序，如`fastapi dev main.py`

## 总结

直到今天，Python环境的搭建仍然不是一件轻松的事情，从技术选型到工具，再到具体的实际操作，都需要花时间去了解和学习。

如本篇博客中的示例，想要运行一个简单的API示例，我们需要接触和了解以下工具或软件包：

- Python
- uv
- FastAPI及命令行
- PyCharm的项目配置
- uvicorn

还好基础环境的搭建不是经常做的事情，再借助`PyCharm`等集成开发工具，能帮助我们节省时间和精力。

### 与现代化的工具比较

`.NET Core`是现代化的开发平台。如果我们想通过.NET来运行一个API服务示例，我们只需要：

- 下载和安装 .NET SDK
- 使用`dotnet new`创建Web API 项目
- 使用`dotnet run`运行项目

或者，对于不熟悉命令行的开发者，只需要安装`Visual Studio`来创建和运行项目即可，一切只需要点点鼠标就完成了。
