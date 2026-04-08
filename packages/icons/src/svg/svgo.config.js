export default {
  plugins: [
    // 默认的优化插件
    'preset-default',

    // 移除 width 和 height 属性
    {
      name: 'removeDimensions',
      active: true
    },

    // 移除 class 属性
    {
      name: 'removeAttrs',
      params: {
        attrs: ['class']
      }
    }
  ]
}
