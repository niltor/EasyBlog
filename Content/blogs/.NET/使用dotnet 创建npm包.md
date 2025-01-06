# 使用dotnet创建npm包

大家在使用npm包的时候，可能会遇到一些问题，比如在还原包(使用`npm install`)的时候会遇到报错，而报错信息可能会提示，需要C++编译环境，或者需要python环境。

包括现在前端的一些打包工具，它可能是使用C++或Rust编写的，但是我们都可以通过npm安装并使用。

这也就意味着，我们可以使用js/ts之外的语言来编写npm包。

## 背景

我之前使用`C#`和`Angular`编写了一个[代码生成器工具](https://github.com/AterDev/ater.dry.cli)，以`dotnet tool`的形式发布，以加速开发速度。

其中一个功能，是根据后端的`OpenAPI`文档内容来生成前端的请求服务代码。

当前端开发想要使用该功能时，就得先安装`dotnet sdk`，然后通过`dotnet tool install -g ater.dry`命令来安装该工具。
虽然也不麻烦，但稍显奇怪，毕竟对于前端来说，都有node环境，但不需要`dotnet`环境。

为了让更多前端能够使用这个工具，那么更好的办法是直接发布成`npm`包，在`package.json`文件中引用该包，在还原项目后，就可以直接使用该工具。

那么问题来了，难道让我重新使用js/ts来编写相关的逻辑么？那是万万不能的！

## 使用dotnet编写npm包

直到我偶然发现微软开源了一个项目`node-api-dotnet`，[`Github`地址](https://github.com/microsoft/node-api-dotnet)。

该项目提供两个能力，即在`dotnet`程序中调用`js`，或在`nodejs`中调用`dotnet`。

这意味着，我之前已经使用好的`C#`代码，现在可以通过某种方式，在`node`项目中使用了。

于是按照这个思路，我对之前的程序进行了一些修改，并使用了`node-api-dotnet`，最终发布`npm`的命令行工具。目前我已经将两个项目发布成npm 命令行工具了。

- [`ater.dry`](https://www.npmjs.com/package/ater.dry)，该工具就是根据OpenApi文档生成前端请求服务代码的工具。
- [`ater.ezblog`](https://www.npmjs.com/package/ater.ezblog)，该工具是一个博客静态网站生成器，可以根据markdown文件生成静态网站。

当然，在使用的过程中遇到了一些问题，通过[反馈问题](https://github.com/microsoft/node-api-dotnet/issues/336)，目前官方已经修复了该问题，并更新了文档示例。

我还没有尝试在`dotnet`项目中调用`node`项目，目前还没有这个需求。