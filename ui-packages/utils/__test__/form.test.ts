import { Validator } from '../form/validate'

describe('校验器', () => {
  const validator = new Validator({
    string: {
      required: '该项必填'
    },
    arr: {
      required: true,
      maxLen: [3, '数组长度必须小于等于3'],
      minLen: [1, '数组长度必须大于等于1']
    },
    num: {
      required: true,
      max: 100000,
      min: 0
    }
  })

  test('测试必填', async () => {
    const result = await validator.validate({
      string: '',
      arr: [],
      num: undefined
    })

    expect(result).toEqual({
      string: ['该项必填'],
      arr: ['该项不能为空'],
      num: ['该项不能为空']
    })
  })

  test('测试单个字段', async () => {
    const result = await validator.validate({
      arr: ['1', '2', '3', '4']
    }, 'arr')

    expect(result).toEqual({
      arr: ['数组长度必须小于等于3']
    })
  })

  test('测试多个字段', async () => {
    const result = await validator.validate({
      arr: ['1', '2', '3'],
      num: -19
    }, ['arr', 'num'])

    expect(result).toEqual({
      num: ['该项必须大于等于0']
    })
  })
})
