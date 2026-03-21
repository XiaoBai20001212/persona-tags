# Persona Tags

SillyTavern 第三方扩展插件。给 User 人设加标签，方便管理和筛选。

写这个的原因很简单：SillyTavern 自带的人设管理太简陋了，人设一多就完全分不清谁是谁，尤其是名字和头像都一样的时候。

## 功能

- **给人设打标签**：在人设管理面板右栏可以给每个人设添加/删除标签，标签带颜色自动区分
- **逗号分隔批量添加**：输入框支持用逗号（中英文均可）分隔多个标签名，回车一次性全部添加
- **人设卡片显示标签**：左栏的人设列表里，每个人设卡片下方直接显示它的标签
- **按标签筛选**：左栏有个"标签筛选"下拉框，选中标签后只显示匹配的人设（多标签取交集）
- **按绑定关系筛选**：默认只显示与当前角色卡绑定的人设，也可以切换到显示全部
- **人设选择弹窗增强**：角色卡绑了多个人设时弹出的选择框，现在能看到头像、名字和标签，不再只有光秃秃的小图
- **复制人设带标签**：复制人设时可以选择"带标签复制"或"不带标签复制"，确认弹窗已汉化

## 安装

把整个 `persona-tags` 文件夹丢到 SillyTavern 的 `public/scripts/extensions/third-party/` 目录下，刷新页面就行。

目录结构应该是这样：
```
SillyTavern/
  public/
    scripts/
      extensions/
        third-party/
          persona-tags/
            manifest.json
            index.js
            style.css
```

## 数据存储

标签数据保存在 SillyTavern 的 `extension_settings` 里，跟随设置自动保存，不会污染原有数据。

## 作者

- [小白](https://github.com/XiaoBai20001212)
- [好大一只鱼](https://github.com/haodayizhiyu404)
