---
title: popup 主动查词：输入框 + 结果区 + 收藏
labels: [ready-for-agent]
date: 2026-07-07
status: done
completed: 2026-07-07
verified: 2026-07-07（真机验证通过）
---

# popup 主动查词：输入框 + 结果区 + 收藏

## Parent

docs/PRD-002-popup-lookup.md（popup 主动查词 — 输入框查单词）

## What to build

单一垂直切片，贯穿校验 → 查词契约 → UI → 测试全部层次：

popup 顶部增加输入框（打开即聚焦）+ 右侧"译"按钮；回车或点按钮触发查询，结果区插入在输入框与收藏列表之间，内容与划词卡片一致（美/英音标点击发音、按词性中文释义、前 3 词组、★ 收藏且已收藏点亮、收藏后列表立即刷新）。查词走既有 lookup 消息契约，background 零改动。

前置重构（先做）："单个纯英文单词（1–45 字母，容忍首尾空格）"校验提升为共享纯模块的 `isTranslatableWord(text)`，popup 以 module script 引用；测试按 TDD 先行加入既有测试文件。

不合规输入在结果区提示"仅支持单个英文单词"且不发请求；notfound/网络失败提示与划词卡片文案一致。

## Acceptance criteria

- [x] `node --test` 全部通过（8/8），新增 `isTranslatableWord` 用例覆盖：合法词、1 与 45 字母边界、46 字母、空串、多词、含数字/标点/中文、首尾空格容忍（TDD，先红后绿）
- [x] 打开 popup 输入框自动聚焦；回车与按钮均可触发查询（真机验证通过）
- [x] 结果区完整展示音标（可发音）、释义、前 3 词组；★ 反映已收藏状态，点击收藏后下方列表立即出现该词（真机验证通过）
- [x] 不合规输入显示提示且不发请求（校验逻辑测试锁定 + 真机验证通过）
- [x] background、content script、manifest 零改动；不引入 npm 依赖与构建步骤
- [x] 收藏列表原有功能（展开词组、删除、导出）不回归（真机验证通过）

## Blocked by

None - can start immediately
