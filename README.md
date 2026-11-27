**简体中文** | [English](docs/README.en.md) | [繁體中文](docs/README.zh-TW.md) | [Русский](docs/README.ru.md) | [한국어](docs/README.ko.md) | [Español](docs/README.es.md) | [Português (BR)](docs/README.pt-BR.md) | [Deutsch](docs/README.de.md) | [Français](docs/README.fr.md) | [ไทย](docs/README.th.md) | [Tiếng Việt](docs/README.vi.md) | [Bahasa Indonesia](docs/README.id.md)

# Persona Tags

SillyTavern 人设管理增强插件。

人设一多就乱，分不清谁是谁。这个插件让你给人设打标签、按标签筛选、批量管理、拖拽排序，把乱糟糟的人设列表理清楚。

## 功能

### 标签系统
- 给人设打标签，逗号分隔一次加多个
- 右栏「已有标签」可展开点选已有标签快速添加（自动隐藏当前人设已有标签，标签多时支持滚动）
- 按标签筛选人设，支持正向（只看选中的）和反向（藏起选中的）
- 筛选面板里长按标签可以拖动排序
- 当前角色卡绑定的人设的标签会微微发亮
- 人设卡片上直接显示标签
- 创建人设时可以一起填标签

### 批量管理
- 点「批量」按钮进入批量模式，卡片出现复选框
- 全选 / 取消全选
- 批量打标签、批量删标签、批量删除

### 排序
- 长按人设卡片拖拽排序（手机也能用）
- 右栏输入位置数字精确跳转
- 每张卡片显示当前排序位号
- 「全部人设」和每个角色卡的绑定人设各有独立排序，互不干扰

### 视图
- 「当前角色」模式：只看当前角色卡绑定的人设
- 「全部人设」模式：看所有人设
- 顶部「↑ / ↓」快捷跳楼滚动：自定义每次跳多少个人设（默认 10，永久记住），长按 0.5 秒直达顶部或底部
- 刷新按钮手动刷新列表
- 列表/网格两种视图都支持

### 多语言与其他
- 完整支持 SillyTavern 官方全部 17 种界面语言，自动跟随酒馆当前语言显示（未覆盖语种自动回退英文）
- 简体中文模式下自动为 ST 原生英文弹窗（创建、重命名、删除等）补齐汉化
- 复制人设时可以勾选是否带标签、带绑定关系
- 多个人设绑同一角色卡时，选择弹窗能看到头像、名字、标签
- 备份 / 恢复人设时自动包含标签、排序与快捷滚动设置

## 安装

把 `persona-tags` 文件夹放到：

```
SillyTavern/public/scripts/extensions/third-party/persona-tags/
```

刷新页面就能用。

## 数据

标签和排序数据存在 SillyTavern 的 `extension_settings` 里，不碰原有数据。删掉插件文件夹就恢复原样，数据留在设置里不会影响 ST 正常使用。

## 作者

- [小白](https://github.com/XiaoBai20001212)
- [好大一只鱼](https://github.com/haodayizhiyu404)
