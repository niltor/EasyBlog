# 升级到Angular 16

Angular 16版本带来了不少重大的变更，但官方的升级帮助页面却出现了重要的失误，缺失重要的升级步骤说明。本篇文章就介绍如何更新到最新的版本，以及如何快速的提高的程序的编译速度。

以下示例演示，如何从Angular14 升级到Angular16。

## 前提条件

升级到Ng16 有些前提条件

- Node.js versions: v16 and v18.
- TypeScript version 4.9.3 or later.
- Zone.js version 0.13.x or later.

## 升级到v15

手动修改`package.json`文件中的内容

```json
"zone.js": "~0.12.0"
"typescript": "~4.9.0"

```

> [!NOTE]
> 请注意，这里我没有将包版本调整到符合Angular16的要求，因为我们当前版本是v14，我们要先升级到v15，然后再升级到v16，这里的包版本是对应v15的要求。

然后运行`pnpm install`或`npm install`。

### 检测更新

使用`ng update`进行更新检测，工具会提示你哪些内容需要升级。

### 更新v15依赖

根据内容提示，先把版本更新升级到v15，然后再升级到v16，以下是示例:

```pwsh
ng update @angular/core@15 @angular/cli@15 
# then commit your repo
ng update @angular/material@15
```

## 升级到v16

先调整包版本

```json
"zone.js": "~0.13.0"
"typescript": "~5.0.0"

```

然后执行`pnpm install`安装新版本包。

### 更新v16依赖

```pwsh
ng update
ng update @angular/core@16 @angular/cli@16 
# then commit your repo
ng update @angular/material@16 
```

### 错误排除

升级过程中遇到错误，有可能是网络问题，请尝试删除`node_modules`,然后重新`pnpm install`后再次尝试。

### 其他内容

如果你还使用了其他类库，需要先确认是否支持Angular16。同时按照官方升级文档，处理其他潜在的问题。

> [!NOTE]
> 在执行`ng update`前，请先暂存当前仓库的内容，否则会警告无法执行！

## 尝试使用esbuild构建

升级v16有很多目的，我个人最主要的是尝试新的构建系统，实测，原先20+s的构建时间，可以缩减到7s，效果十分显著，使用起来也非常简单，我们来尝试一下。

修改`angular.json`中的配置：

```json
"architect": {
  "build": {
    "builder": "@angular-devkit/build-angular:browser-esbuild",
    //...
  }
  //...
}
```

然后尝试一下`ng build`与`ng serve`，你会发现他们花费的时间差不多，build的时间大大缩减！

这比`signal`什么的香多了！
