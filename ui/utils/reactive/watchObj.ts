import { watch } from 'vue'

/**
 * 监听响应式对象
 * @param obj 响应式对象
 * @param cb 回调
 */
function watchObj(obj, cb) {
  const watchSources = Object.keys(obj).map(key => {
    return () => obj[key]
  })

  const proxyObj = new Proxy(obj, {})
}
