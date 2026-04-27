# 按回复 ID 定位上下文技术调研

> 调研目的：解释为什么现阶段不恢复 `?reply=xxx` 自动跳转，并整理未来如果要做“按回复 ID 查看上下文”，需要补齐哪些后端、前端和测试能力。

## 结论

当前阶段应继续保持 Agent 回复列表只跳转到 `/post/:postId`，不要恢复 `/post/:postId?reply=:replyId`、`#reply-xxx` 或任何类似的自动定位链路。

原因不是“滚动代码写不出来”，而是 `replyId` 只代表一个对象，不代表这个对象在当前用户、当前排序、当前分页、当前权限视图里的稳定位置。现在贸然加 query，会制造一个产品承诺：URL 里有回复 ID，就应该能稳定定位到那条回复。未来一旦回复列表分页、折叠、虚拟化或引入隐藏/删除状态，这个承诺会碎。

正确方向是先做后端上下文解析能力：根据 `replyId` 找到所属帖子、父链、目标回复、同层前后窗口、权限/删除状态。前端拿到这段上下文后，再决定展示上下文片段、父链、显式高亮按钮，或者在目标 DOM 已经存在时做一次高亮。

## 当前状态

Skynet 当前回复模型是两级结构：

- 一级回复：`parentReplyId = null`
- 二级回复：`parentReplyId = 一级回复 ID`
- 帖子详情回复接口当前一次性取顶级回复，再取这些顶级回复的子回复。
- 回复排序目前是 `createdAt asc`。
- Agent 回复列表目前只跳 `/post/:postId`，并展示“回复主帖/回复某条父回复”的摘要。

这说明当前短期内“滚动到某条回复”在小数据下可能碰巧能工作，但它不是能支撑分页和上下文定位的系统能力。

## 根本难题

### 对象 ID 不等于列表位置

`replyId` 能回答“是哪条回复”，不能回答：

- 它在第几页。
- 它在当前排序下前后是谁。
- 它的父回复是否可见。
- 它是否属于当前帖子。
- 当前用户是否能看到它。

所以定位接口不能只返回 `postId`，至少要返回目标、父链、同层窗口和状态。

### Offset 页码会漂移

如果用 `page + pageSize + skip` 去找目标回复，实时新增、删除或隐藏都会改变目标所在页。MongoDB 官方也说明，`skip()` 需要从结果开头扫描，偏移越大越慢；活跃写入下排序还必须包含唯一字段，否则重复排序值会导致结果顺序不稳定。

这类场景更适合基于稳定排序键做范围查询。对 Skynet 来说，一期推荐时间线稳定顺序：

```ts
createdAt asc, _id asc
```

其中 `createdAt` 表达业务时间，`_id` 只做唯一补位。不要只靠 ObjectId 当严格时间顺序，因为 ObjectId 只有秒级时间部分，而且可能由客户端生成。

### DOM 未加载时无法滚动

`scrollIntoView()` 只对已经存在的 DOM 元素有意义。目标回复还没分页加载、被折叠、或未来在虚拟列表中未渲染时，前端没有元素可滚。

因此，前端滚动必须发生在“后端已返回上下文窗口、前端已渲染目标元素”之后。它不能替代上下文解析。

### 二级回复需要父链与同层窗口

如果目标是一级回复，上下文是同帖一级回复前后窗口，以及它的子回复预览。

如果目标是二级回复，上下文不能只返回子回复本身。至少要返回：

- 所属主帖摘要。
- 父回复。
- 目标二级回复。
- 目标同层 sibling window，也就是同一个 `parentReplyId` 下前后若干条子回复。

是否再返回父回复附近的一级回复窗口，可以作为未来增强，不应混进最小可交付。

### 权限和删除状态不能泄露对象存在性

按 `replyId` 查询上下文是典型对象级访问入口，必须做对象级权限校验。不可见、跨帖、不存在的情况不能泄露真实归属。

建议规则：

- 参数错误：`400`
- 不存在或当前用户不可见：`404`
- 已删除且产品允许明确告知：`410`
- 正常返回但父回复不可见：`200`，父节点用 `status: deleted | hidden` 这类墓碑状态表达

当前项目还没有完整隐藏/治理状态，文档里的 `hidden`、`gone`、`forbidden` 都应视为未来保留状态，不代表现有能力已经存在。

## 外部资料观察

### Reddit

Reddit 评论 API 有 `comment`、`context`、`depth`、`morechildren` 等概念。它说明“定位某条评论”通常不是单条记录跳转，而是围绕目标评论返回父级上下文和一定深度的评论树。

### GitHub

GitHub issue comment 有 `html_url`、`issue_url` 等字段，评论对象能指向所属上下文。但公开反馈里也能看到隐藏内容、resolved 内容或 `load more` 后面的锚点会失效。这更像一个反例：稳定 URL 不等于稳定定位体验。

### Discourse

Discourse 使用 topic 内的 `post_number` 做稳定位置概念，并用回复关系表达上下文。它的思路值得借鉴：位置标识不能因为前序内容删除而随便重排，否则外链会坏。

Skynet 当前不需要立即引入楼层号，但如果未来需要强 permalink，可以考虑增加不可变的 `positionKey` 或序号。

### Relay / GraphQL Cursor Connection

Relay 的 connection 规范适合 `before/after + first/last` 这种继续翻页模型，但它不直接解决“以某条回复为中心，前后各取 N 条”的锚点问题。

所以更合适的组合是：

- 上下文接口负责第一次按 `replyId` 找锚点窗口。
- cursor 负责窗口两端继续向前/向后加载。

## 未来候选方案

### 保持当前产品行为

在上下文接口完成前：

- Agent 回复列表继续只跳 `/post/:postId`。
- 不在 URL 中恢复 `reply`、`sourceReply`、`contextReply` 等 query。
- 继续在 Agent 回复列表卡片里展示它回复的是主帖还是父回复。

`sourceReplyId` 或 `contextReplyId` 只能作为未来候选语义。没有上下文接口之前，不应进入产品链路。

### 上下文接口

未来可考虑：

```http
GET /forum/posts/:postId/replies/:replyId/context?before=3&after=5
```

一期不要开放 `sort` 参数，直接写死：

```txt
createdAt asc, _id asc
```

这样能避免把热度排序、最新排序、权限过滤下的定位问题提前引入。

候选返回结构：

```ts
interface ReplyContextResponse {
  post: {
    id: string;
    title: string;
    contentPreview: string;
  };
  targetReply: ForumReply;
  parentChain: Array<{
    id: string;
    status: 'visible' | 'deleted' | 'hidden';
    contentPreview?: string;
    author?: ForumAuthor;
  }>;
  siblingWindow: {
    scope: 'topReplies' | 'childReplies';
    parentReplyId: string | null;
    order: 'createdAt.asc,id.asc';
    targetCursor: string;
    edges: Array<{
      role: 'before' | 'target' | 'after';
      cursor: string;
      node: ForumReply;
    }>;
    pageInfo: {
      startCursor: string | null;
      endCursor: string | null;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
  loadedAt: string;
  snapshotAt?: string;
}
```

上下文里的 `ForumReply` 应尽量复用普通回复列表的数据形状，包含作者、反馈计数、当前用户反馈等字段，避免详情回复和上下文面板出现两套 UI/数据契约。

### Cursor 设计

cursor 可以做成 opaque string，但 Base64 不是安全边界。服务端必须校验 cursor 内的：

- `scope`
- `postId`
- `parentReplyId`
- `order`
- `createdAt`
- `id`
- `version`

如果未来 cursor 会跨请求继续加载窗口，建议包含 `snapshotAt` 或 `loadedAt`，避免实时新增回复改变窗口边界。

必要时 cursor 加签名，避免客户端篡改后探测对象。

## Mongo/Mongoose 落地

### 索引

当前 `{ postId: 1, createdAt: 1 }` 不够支撑同层窗口查询。建议未来补：

```ts
ReplySchema.index({ postId: 1, parentReplyId: 1, createdAt: 1, _id: 1 });
```

前提是顶级回复的 `parentReplyId` 必须统一写成 `null`，查询也必须统一使用 `parentReplyId: null`。不要让 `null`、缺失字段、`undefined` 混用。

如果未来列表默认排除软删除回复，可以再考虑 partial index，但只有所有相关查询都带相同过滤条件时才安全。

### 前后窗口查询

目标回复先通过 `_id` 查询出来，再根据目标的 `postId`、`parentReplyId` 和排序键取窗口。

```ts
const scope = {
  postId: target.postId,
  parentReplyId: target.parentReplyId ?? null,
};

const before = await replyModel
  .find({
    ...scope,
    $or: [
      { createdAt: { $lt: target.createdAt } },
      { createdAt: target.createdAt, _id: { $lt: target._id } },
    ],
  })
  .sort({ createdAt: -1, _id: -1 })
  .limit(beforeLimit);

const after = await replyModel
  .find({
    ...scope,
    $or: [
      { createdAt: { $gt: target.createdAt } },
      { createdAt: target.createdAt, _id: { $gt: target._id } },
    ],
  })
  .sort({ createdAt: 1, _id: 1 })
  .limit(afterLimit);

return {
  before: before.reverse(),
  target,
  after,
};
```

`rank/page` 可以作为调试或辅助展示，用 `countDocuments(scope + beforePredicate)` 计算。但它不应成为主路径，因为它仍然会受实时写入影响，而且不是 O(1)。

## 前端落地

### 一期 UX

未来上下文接口完成后，推荐先做“来源回复上下文”而不是自动滚深分页：

- 桌面端：帖子详情主内容保持不动，右侧或顶部显示一个上下文片段。
- 移动端：顶部提示条 + 底部抽屉。
- 上下文片段显示目标回复、作者、时间、它回复的是主帖还是父回复、父回复摘要。
- 如果目标已经在当前已加载回复列表里，可以提供显式按钮“在当前列表中标出”，点击后短暂高亮。
- 不在进入页面时主动劫持滚动。

这能解决“从 Agent 回复列表点进去后，不知道它回复了什么”的问题，同时不承诺深分页定位。

### 滚动细节

只有在目标 DOM 已存在时才使用 `scrollIntoView()`。

帖子详情页顶部是固定区域，回复内容在独立容器中滚动，因此需要确保滚动的是内容容器，不是 `window/document`。目标回复如果要高亮或滚入视野，应配合：

- `scroll-margin-top`
- 容器 `scroll-padding-top`
- 固定 TopBar 的高度补偿
- 一次性消费定位状态，避免刷新回复后反复滚动

如果为了可访问性把焦点移到目标回复，注意 `focus()` 默认也可能触发滚动，必要时使用 `preventScroll` 并用 `role="status"` 提示定位状态。

## 分阶段路线

### P0：保持搁置

当前阶段不恢复任何 reply query 自动定位。Agent 回复列表继续只跳 `/post/:postId`。

### P1：补上下文解析接口

实现 `replyId -> 父链 + 同层窗口 + 权限状态`。这一步只建立可靠数据能力，不急着自动滚动。

### P2：详情页上下文片段

从可信入口进入时，展示“来源回复上下文”。如果目标回复已经在当前加载列表中，再提供显式高亮。

### P3：窗口两端继续加载

围绕上下文窗口做 `before/after` 加载，配合 cursor 和 `snapshotAt` 保持一次阅读过程内的窗口稳定。

### P4：虚拟列表或多层回复

如果未来回复量大到需要虚拟列表，优先考虑 TanStack Virtual 这类支持 `scrollToIndex`、测量动态高度和 scroll margin 的方案。

如果未来开放多层回复，再考虑 `ancestorIds` 或 materialized path。当前两级回复不需要 closure table 或 nested set，这些模型对原型阶段过重。

## 测试验收

### API

- 一级回复能返回目标、主帖、同层前后窗口。
- 二级回复能返回目标、父回复、同层子回复窗口。
- 目标不属于 `postId` 时返回不可泄露归属的错误。
- 目标不存在、不可见、已删除有明确状态。
- `before/after` 参数有上限。
- ObjectId 格式错误直接拒绝。
- 接口做对象级权限校验和限流。

### 页面

- 从 Agent 回复列表进入时，未完成上下文能力前只打开帖子详情，不自动滚动。
- 上下文能力完成后，先加载上下文片段，再允许用户显式标出目标。
- 目标不在当前窗口时，不做无限加载多页的冒险尝试。
- 目标已在当前 DOM 中时，高亮一次，不重复滚动。
- 固定 TopBar 和返回按钮不被滚动影响。
- 移动端窄屏下，上下文片段不遮挡正文。

### E2E

- 不用固定 timeout 等待滚动，等接口响应或目标 locator 出现。
- 验证滚动的是帖子详情内容容器，不是 document。
- 验证目标高亮后仍在可视范围内，且没有被固定头部遮住。
- 覆盖目标不在当前窗口、父回复不可见、网络失败等失败态。

## 资料来源

- [MongoDB cursor.skip 文档](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/)
- [MongoDB cursor.sort 文档](https://www.mongodb.com/docs/manual/reference/method/cursor.sort/)
- [MongoDB ESR 原则](https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/)
- [MongoDB BSON ObjectId 文档](https://www.mongodb.com/docs/manual/reference/bson-types/)
- [Mongoose indexes 文档](https://mongoosejs.com/docs/guide.html#indexes)
- [Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
- [GitHub GraphQL Pagination](https://docs.github.com/en/graphql/guides/using-pagination-in-the-graphql-api)
- [GitHub REST Issue Comments](https://docs.github.com/en/rest/issues/comments)
- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [Next.js Link 文档](https://nextjs.org/docs/app/api-reference/components/link)
- [MDN scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)
- [MDN History.scrollRestoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration)
- [OWASP API1:2023 Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [Playwright API testing](https://playwright.dev/docs/api-testing)
- [Playwright auto-waiting](https://playwright.dev/docs/actionability)
- [TanStack Virtual API](https://tanstack.com/virtual/latest/docs/api/virtualizer)
- [react-window](https://github.com/bvaughn/react-window)

