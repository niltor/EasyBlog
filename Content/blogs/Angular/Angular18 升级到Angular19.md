# Angular18 升级到Angular19

基本包的版本升级这里就不再多说了，着重说一下，升级之后，代码要做怎么样的处理。

我这里使用了`Angular Material`，所以要进行一些处理。

## SCSS文件更新

当你使用SCSS时，一些用法已经被遗弃，必须使用新的写法，如:

### 使用@use 替换 @import

将@import 全部修改成使用`@use 'path' as xx`的形式,

然后在使用变量前加上`xx`前缀。

### darken与lighten

darken 与lighten 都被废弃了，需要修改成
`color.adjust`.

如
`background-color: lighten($color: vars.$light-primary-color, $amount: 8%);`

变成

`background-color: color.adjust($color: vars.$light-primary-color, $lightness: 8%);`

### 将M2升级到M3

主题和一些函数的定义和使用都发生了变化。

最好重写主题内容，通过`ng generate @angular/material:theme-color`生成新的主题模板.
