# Persona Tags — 项目文档

## 这是什么

SillyTavern（ST）的第三方浏览器扩展插件，给 User 人设（Persona）加标签、筛选、批量管理、拖拽排序。纯前端，jQuery + 原生 JS，零 import，通过 `SillyTavern.getContext()` 访问 ST 的 API。

## 文件结构

```
persona-tags/
├── index.js        (~1950 行) 全部逻辑
├── style.css       (~690 行)  全部样式
├── manifest.json   ST 扩展清单
├── README.md       用户说明
└── CLAUDE.md       本文件
```

就这 4 个源文件，没有构建工具，没有依赖。

## 运行环境

- 运行在 SillyTavern 的浏览器页面里（不是 Node.js）
- jQuery 由 ST 提供（全局可用）
- 通过 `SillyTavern.getContext()` 访问 ST 的设置、角色列表、人设数据等
- 数据存在 `ctx.extensionSettings.personaTags`

## 核心架构

### 接管渲染

插件**完全接管了 ST 原生的人设列表渲染**。ST 原生的分页、排序控件被 CSS 隐藏。当 ST 重新渲染列表时，MutationObserver 拦截并替换为我们自己的卡片。

关键机制：
- `isOwnRender` 布尔标志 + `setTimeout(0)` 防止 Observer 死循环
- `getContextList()` — 完整队列（只管视图模式 + 自定义排序，不管标签/搜索筛选）
- `applyFilters()` — 在 `getContextList()` 基础上叠加搜索 + 标签筛选
- `buildPersonaCard()` — 构建单张卡片，复用 ST 的 `.avatar-container` 结构 + CSS 变量保证主题兼容
- `applyFiltersAndRender()` — 编排入口：算一次 contextList → 过滤 → 渲染 → 工具栏 → 拖拽

ST 的卡片点击委托 `$(document).on('click', '#user_avatar_block .avatar-container')` 仍然生效，因为我们的卡片保持了相同的 class 和 data 属性。

### 排序系统

排序按上下文隔离存储在 `personaOrder` 对象里：
```
personaOrder: {
    "_all": [avatarId1, avatarId2, ...],        // 全部人设
    "char:角色.png": [avatarId3, ...],          // 某角色卡的绑定人设
    "group:群组id": [avatarId5, ...],           // 某群组的绑定人设
}
```

拖拽和位置编辑使用**合并算法**：只改动可见项的相对位置，不影响被筛选隐藏的项。核心逻辑在 `onPersonaDragEnd` 和 `movePersonaToPosition` 里。

### 批量模式

`batchMode` 布尔标志控制。开启后卡片出现复选框，选中状态存在 `selectedAvatars` Set 里。筛选变化时自动裁剪选中集（`pruneSelection`）。

### 弹窗系统

三个自定义弹窗：`showBatchInput`（文字输入）、`showBatchTagPicker`（标签选择器）、`showBatchConfirm`（删除确认）。都用 `stopPropagation` 防止事件穿透到 ST 导致抽屉关闭。

### 弹窗翻译

`startPopupObserver` 用 MutationObserver 监听 `document.body`，检测 ST 的原生弹窗并翻译为中文。有 `requestAnimationFrame` 防抖 + `addedNodes` 过滤避免性能问题。创建人设弹窗还会注入标签输入框。

### 孤儿数据清理

- `purgeOrphanedEntries` — 清理 tagMap 里已删人设的条目
- `purgeOrphanedSTEntries` — 清理 ST 自身残留的已删人设记录
- `purgeOrphanedOrders` — 清理排序对象里已删角色卡/群组的 key + 数组里已删人设的 ID

## 状态变量清单

闭包里有 ~20 个状态变量，主要的：
- `serverAvatarList` / `serverAvatarSet` — 服务器头像缓存
- `currentPersonaAvatar` — 当前选中的人设
- `viewMode` — 'connected' | 'all'
- `activeFilters` / `filterMode` — 标签筛选状态
- `batchMode` / `selectedAvatars` — 批量选中状态
- `isOwnRender` — 渲染守卫
- `isDragging` / `dragState` — 标签拖拽状态
- `personaDragState` — 人设卡片拖拽状态
- `pendingDuplication` — 复制人设待处理状态
- `pendingCreationTags` — 创建人设待应用标签

## 关键注意事项

- **手机兼容**：所有交互都要考虑触屏。长按拖拽用 pointer events + 400ms 阈值。输入框用 `<form submit>` 不用 `keydown`（安卓虚拟键盘的 Enter 返回 "Unidentified"）。
- **主题兼容**：所有颜色用 `var(--SmartThemeXxx)` CSS 变量，不硬编码。
- **ST 版本兼容**：不 import ST 的模块，不直接调用 ST 的非公开函数。通过 DOM 结构和事件委托与 ST 交互。
- **characters 数组可能有 null 空洞**：ST 删角色后数组里留坑，遍历时要用 `c?.avatar`。
- **`saveSettingsDebounced`**：所有设置修改通过这个防抖保存，不要直接写文件。

## ST 相关源码位置（参考）

如果需要看 ST 的人设管理源码：`SillyTavern/public/scripts/personas.js`

关键函数：
- `getUserAvatars()` — 拉数据 + 渲染列表（我们拦截这个）
- `setUserAvatar()` — 选中人设（通过事件委托自动触发）
- `updatePersonaUIStates()` — 更新卡片的选中/锁定状态 class
