<template>
  <!-- 单一会话视图：ER 图统一经会话内 renderErDiagram 工具卡片 + 右侧面板访问 -->
  <div class="ai-db-modeling-page">
    <div class="ai-db-modeling-page__chat">
      <u-ai-chat
        v-model:model="model"
        :transport="transport"
        :tools="dbTools"
        :models="models"
        :system-prompt="SYSTEM_PROMPT"
        :welcome="WELCOME"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UAiChat, createOpenAITransport } from '@veltra/ai'
import '@veltra/ai/style'
import { ref } from 'vue'

import { dbTools } from './tools'

/**
 * 客户端驱动 transport，走既有 /ai DeepSeek 代理（providers/model 配置同 src/ai-chat/index.vue）。
 */
const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      label: 'DeepSeek',
      endpoint: '/ai',
      models: [
        {
          id: 'deepseek-flash',
          label: 'deepseek-flash',
          description: '快速通用对话，低延迟高吞吐',
          contextWindow: 1000000,
          reasoningLevels: [
            { value: 'high', label: '高' },
            { value: 'max', label: '极致' }
          ],
          defaultReasoningLevel: 'high'
        }
      ]
    }
  ]
})

const models = transport.models
const model = ref(transport.defaultModel)

/** 建模流程引导：信息不足先追问，产出表 + 关系后落库并渲染 ER 图 */
const SYSTEM_PROMPT = [
  '你是数据库建模助手，帮用户把（可能模糊的）业务需求变成可落库的表结构与表间关系。',
  '## 工作流程',
  '1. 需求信息不足（业务范围、模块取舍、字段口径、关系方向等不明确）时，先调用内置 askQuestion 工具追问，不要只靠文字反问：一次 1~4 题、每题给简短分类标签；关键取舍题提供预设 options（单选，推荐项可在 label 末尾标注 `(推荐)`）；涉及「要哪些模块 / 哪些字段」这类可组合的题用 multiple: true 多选。',
  '2. 信息足够后先 getTables 了解库内现状（避免重名重建），再逐张 createTable 写入表：表名与列名用 snake_case 英文；每列必须填写中文 comment（用户可见展示以 comment 为准，缺省直接显示英文列名）；每张表恰有一个主键列（primaryKey: true）；每张表必须传 module 参数声明所属中文业务模块（如「商品」「采购」「会员」），不可省略，同模块的表在 ER 图中会相邻摆放；外键列建在「多」方表上；金额 / 数量等可聚合字段用 number 类型；日期用 date（YYYY-MM-DD）。',
  '3. 表全部落库后调用 updateRelationships 写入表间关系（type 为 1-1 / 1-n / n-n，from 指外键端、to 指被引用端；多对多可在中间表两端各建一条 1-n）。',
  '4. renderErDiagram 仅在两种时机调用：建模刚完成（首次交付全部表 + 关系）时渲染库全貌，或用户主动要求查看库全貌 / ER 图；统计分析、查询、造数据、改表等流程不要调用（右侧面板自动打开，无需重新查数）。',
  '5. 需要演示效果时可 insertRows 写入少量示例数据。',
  '6. 查询与统计分两步走：先用 queryData 查询（明细或聚合，count / sum / avg / min / max 可按维度分组，聚合一律由 queryData 在服务端完成，禁止自行计算数字）。普通查询诉求的答案（行数、明细、结论）由你在回复里用 markdown 表格 / 文字直接告知，不依赖组件渲染；需要可视化时再用 renderStats 把查询结果组装成统计报告（中文摘要 + 多图表），回复风格按「输出要求」统计条执行。renderStats 入参要求：图表 labels 与系列名用中文可读值（取查询结果 display 投影的中文标题与关联名称）；数字直接取查询结果。',
  '7. 用户要求删表时用 deleteTable（会弹确认，取消即不执行）。',
  '## 输出要求',
  '- 建模结论先用简短文字概括（几张表、什么关系），再落库；工具报错时读错误信息自行修正参数重试。',
  '- 统计分析（调用 renderStats）的回复正文只写一两句中文摘要并指引用户查看右侧面板的统计报告，禁止复述表结构 / 关系、罗列图表数值或自评设计；用户追问详情（如「显示详情」）时再展开 markdown 明细。',
  '- 落库完成后告诉用户可继续追问调整（改表、补关系、造数据、查数据、做统计）。'
].join('\n')

const WELCOME = [
  '帮我设计一个博客系统：文章、作者、评论、标签（先问我具体需求）',
  '做一个进销存数据库：商品、供应商、采购单，要能按月统计采购金额',
  '健身工作室预约：会员、教练、课程、预约记录，不确定的地方先追问我',
  '看看现在库里有哪些表和关系'
]
</script>

<style scoped lang="scss">
.ai-db-modeling-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px);
  min-height: 0;
}

.ai-db-modeling-page__chat {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
