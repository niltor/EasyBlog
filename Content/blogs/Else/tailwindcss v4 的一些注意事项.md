# Tailwindcss v4 的一些注意事项

在我的`EasyDoc`项目中，我有用到`tailwindcss`，最近在更新样式时，发现了一些变更，这里记录一下。

## 安装方式

新的版本中，不再是安装`tailwindcss`，而是安装`@tailwindcss/cli`。

## 样式问题

这里我主要遇到了两个问题，分别是`hidden`与`w-100`。

### 使用w-full替换成w-100

我发现`w-100`不再生效，需要使用`w-full`。

### hidden的问题

在部分布局中，为了响应式布局，我会将部分元素在宽度较小的时候隐藏，原始的样式，会发现不再生效，使用`hidden`，元素会一直没有办法显示。

比如代码:

```html
<div class="flex flex-wrap">
  <!-- 左侧内容：小屏占满宽度，sm 及以上占 3/4 -->
  <div class="sm:w-3/4 sm:pr-4 w-full">
    左侧内容
  </div>
  <!-- 右侧内容：小屏隐藏，sm 及以上显示，占 1/4 -->
  <div class="w-1/4 mt-1 hidden sm:block">
    右侧内容
  </div>
</div>

```

以上代码，右侧内容会一直隐藏，不管你的宽度如何变化。这个问题我查找了很长时间，也试了各种AI提供的方法，都没有解决，最后我自己官方`github`中的`discussion`中的某个回复中，找到了相应的解决方法。我们需要在`hidden`前面加上前缀，明确指定隐藏的屏幕大小。

```html
<div class="flex flex-wrap">
  <div class="sm:w-3/4 sm:pr-4 w-full">
    左侧内容
  </div>
  <div class="w-1/4 mt-1 max-sm:hidden sm:block">
    右侧内容
  </div>
</div>
```
