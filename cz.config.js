import { definePrompt } from 'czg'
import { readdirSync } from 'fs'

const scopes = readdirSync('./ui')

export default definePrompt({
  alias: { fd: 'docs: fix typos' },
  messages: {
    type: '选择你要提交的类型 :',
    scope: '选择一个提交范围（可选）:',
    customScope: '请输入自定义的提交范围 :',
    subject: '填写简短精炼的变更描述 :\n',
    body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
    breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
    footerPrefixesSelect: '选择关联issue前缀（可选）:',
    customFooterPrefix: '输入自定义issue前缀 :',
    footer: '列举关联issue (可选) 例如: #31, #I3244 :\n',
    confirmCommit: '是否提交或修改commit ?'
  },

  types: [
    { value: 'feat', name: 'feat:    ✨ 新增功能', emoji: ':sparkles:' },
    { value: 'fix', name: 'fix:     🐛 修复缺陷', emoji: ':bug:' },
    { value: 'docs', name: 'docs:    📝 文档更新', emoji: ':memo:' },
    {
      value: 'style',
      name: 'style:   💄 代码格式',
      emoji: ':lipstick:'
    },
    {
      value: 'refactor',
      name: 'refactor:💡 代码重构',
      emoji: ':bulb:'
    },
    {
      value: 'perf',
      name: 'perf:    🚀 优化',
      emoji: ':rocket:'
    },
    {
      value: 'test',
      name: 'test:    🧪 测试相关',
      emoji: ':test_tube:'
    },
    {
      value: 'build',
      name: 'build:   🔨 构建相关',
      emoji: ':hammer:'
    },
    {
      value: 'ci',
      name: 'ci:      🔩 持续集成',
      emoji: ':construction:'
    },
    { value: 'revert', name: 'revert:  🔙 回退代码', emoji: ':rewind:' },
    {
      value: 'chore',
      name: 'chore:   🔧 其他修改',
      emoji: ':wrench:'
    }
  ],
  useEmoji: true,

  emojiAlign: 'center',
  useAI: false,
  aiNumber: 2,
  themeColorCode: '',

  allowCustomScopes: true,
  allowEmptyScopes: true,
  customScopesAlign: 'bottom',
  customScopesAlias: 'custom',
  emptyScopesAlias: 'empty',
  upperCaseSubject: false,
  markBreakingChangeMode: false,
  allowBreakingChanges: ['feat', 'fix'],
  breaklineNumber: 100,
  breaklineChar: '|',
  skipQuestions: [],
  issuePrefixes: [
    // 如果使用 gitee 作为开发管理
    { value: 'link', name: 'link:     链接 ISSUES 进行中' },
    { value: 'closed', name: 'closed:   标记 ISSUES 已完成' }
  ],
  customIssuePrefixAlign: 'top',
  emptyIssuePrefixAlias: 'skip',
  customIssuePrefixAlias: 'custom',
  allowCustomIssuePrefix: true,
  allowEmptyIssuePrefix: true,
  confirmColorize: true,
  scopeOverrides: undefined,
  defaultBody: '',
  defaultIssues: '',
  defaultScope: '',
  defaultSubject: '',
  scopes,
  aiQuestionCB: ({ maxSubjectLength, diff }) =>
    `用完整句子为以下 Git diff 代码写一个有见解并简洁的 Git 中文提交消息，不要添加任何前缀，并且内容不能超过 ${maxSubjectLength} 个字符: \`\`\`diff\n${diff}\n\`\`\``
})
