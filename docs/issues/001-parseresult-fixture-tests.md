---
title: 固化 parseResult 的 fixture 测试
labels: [ready-for-agent]
date: 2026-07-07
status: done
completed: 2026-07-07
---

# 固化 parseResult 的 fixture 测试

## Parent

docs/PRD.md（Tiny Translator — 精简划词查词 Chrome 插件）

## What to build

为查词数据解析的唯一接缝——background 模块中的纯函数 `parseResult(word, apiJson)`——建立基于 fixture 的自动化测试，把开发期做过的一次性验证固化为可重复运行的测试。

输入是有道 jsonapi 的原始 JSON 响应，输出是查词结果结构（该 shape 已由原型对真实接口验证后固化）：

```
{ word, usPhone, ukPhone, defs: string[], phrases: [{ text, trans }] }
```

fixture 使用开发期抓取的 `example` 一词真实接口响应，另补一个"查不到词"的空响应 fixture。测试运行器用 node 内置 `node:test`，保持项目零依赖、无构建的约束。只断言外部行为（给定 JSON → 断言输出结构），不断言解析内部实现。

注意：`parseResult` 所在模块是 MV3 service worker 脚本，不是可直接 import 的 ES/CommonJS 模块——测试如何加载该函数由实现者决定（可做最小前置重构，但不得破坏插件在 Chrome 中的直接加载）。

## Acceptance criteria

- [x] `node --test` 一条命令即可运行全部测试且通过（5/5）
- [x] 覆盖正常路径：美/英音标提取正确、按词性释义条数与内容正确、词组截断为恰好前 3 条且含中文翻译
- [x] 覆盖 notfound 路径：响应缺少英汉词典字段或释义为空时返回 null
- [x] 覆盖可选字段缺失：音标缺失、词组缺失时不视为失败，对应字段为空值
- [x] fixture 来自真实接口响应（example 完整词条 + 乱码词空响应，2026-07-07 抓取）
- [x] 不引入任何 npm 依赖、不引入构建步骤
- [x] 重构方式：parseResult 抽至 parse.mjs（ESM），service worker 声明为 module 类型后 import；ESM 语法与 manifest 已静态校验，真机装载已验证通过（2026-07-07，随 issue 002 一并验证）

## Blocked by

None - can start immediately
