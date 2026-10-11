# 模板参数使用指南

## 概述

现在 `applyTemplate1` 函数支持通过参数来自定义模板样式。你可以通过 `settings` 对象传递各种模板参数来控制卡片的外观。

## 可用的模板参数

### 基本参数

-   `template`: 模板名称，设置为 `"template1"` 来启用模板，设置为 `"none"` 来禁用模板

### 样式参数

-   `templateBackgroundColor`: 背景颜色 (十六进制颜色值，如 `"#FFDCDC"`)
-   `templateBorderColor`: 边框颜色 (十六进制颜色值，如 `"#CCCCCC"`)
-   `templateBorderWidth`: 边框宽度 (数字，如 `2`)
-   `templateCornerRadius`: 圆角半径 (数字，如 `12`)
-   `templateFontSize`: 字体大小 (数字，如 `16`)
-   `templateTextColor`: 文字颜色 (十六进制颜色值，如 `"#000000"`)

## 使用示例

### 基本使用

```javascript
const settings = {
    template: "template1",
    cardSize: "medium",
    cardColor: "#FFFFFF"
};
```

### 自定义样式

```javascript
const settings = {
    template: "template1",
    cardSize: "large",
    cardColor: "#FFFFFF",
    // 模板参数
    templateBackgroundColor: "#E8F4FD",
    templateBorderColor: "#2196F3",
    templateBorderWidth: 3,
    templateCornerRadius: 15,
    templateFontSize: 18,
    templateTextColor: "#1976D2"
};
```

### 禁用模板

```javascript
const settings = {
    template: "none",
    cardSize: "medium",
    cardColor: "#FFFFFF"
};
```

## 默认值

如果不指定模板参数，将使用以下默认值：

-   `backgroundColor`: 使用预定义的颜色数组 (按索引循环)
-   `borderColor`: `"#CCCCCC"`
-   `borderWidth`: `2`
-   `cornerRadius`: `12`
-   `fontSize`: 基于卡片大小的响应式字体大小
-   `textColor`: `"#000000"`

## 注意事项

1. 所有颜色值必须是有效的十六进制颜色格式
2. 数字参数必须是有效的数字
3. 如果参数值无效，将使用默认值
4. 模板功能是可选的，可以通过设置 `template: "none"` 来禁用
