---
'@veltra/ai': patch
---

- ai: 会话模式断线重连不再让消息在「完成 / 思考中」间来回翻转——`ChatSessionEvent` 新增 `history` 标记（历史回放/断线补拉来源），fold 对流式中的消息不降级为 done、不用更短的落后快照覆盖内容，内容取更长者；`seq` 类型改为可选以匹配瞬态/历史事件的真实形态
- ai: session 模式 `onDisconnect` 不再把 `running` 置 false（断线 ≠ 停止，由重连回放的 prompted/idle 收敛），修复步骤间隙断线导致过程块在「已完成 / 思考中」折叠态反复横跳、消息数量跳变
