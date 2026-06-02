import { describe, expect, it } from 'vitest'

import { DynamicFormModel } from '../dynamic-form-model'
import { FormModel } from '../form-model'
import { formField, nestField } from '../helper'

describe('FormModel with Nested Fields', () => {
  it('should flatten fields and initialize data correctly', () => {
    const model = new FormModel({
      name: formField({ value: 'Alice' }),
      contact: nestField({
        email: formField({ value: 'alice@example.com' }),
        phone: formField({ value: '12345678901' })
      })
    })

    // Verify allKeys
    expect(model.allKeys).toEqual(['name', 'contact.email', 'contact.phone'])

    // Verify initialData and data
    expect(model.data).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })
    expect(model.initialData).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })
  })

  it('should validate flat and nested fields correctly', async () => {
    const model = new FormModel({
      name: formField({ value: '', required: 'Name is required' }),
      contact: nestField({
        email: formField({ value: 'invalid-email', preset: 'email' }),
        phone: formField({ value: '12345678901', required: true })
      })
    })

    // Expect initial validation to fail on name and contact.email
    await expect(model.validate()).rejects.toBe(false)
    expect(model.errors.get('name')).toEqual(['Name is required'])
    expect(model.errors.get('contact.email')).toEqual(['邮箱格式不正确'])
    expect(model.errors.get('contact.phone')).toBeUndefined()

    // Fix name and contact.email, and trigger validation
    model.data.name = 'Bob'
    model.data.contact.email = 'bob@example.com'

    // We need to wait for watch effects/nextTick if reactive triggers validation on change
    // Since validate() is an async function, let's call it directly
    const valid = await model.validate()
    expect(valid).toBe(true)
    expect(model.errors.size).toBe(0)
  })

  it('should set data and reset data correctly', () => {
    const model = new FormModel({
      name: formField({ value: 'Alice' }),
      contact: nestField({
        email: formField({ value: 'alice@example.com' }),
        phone: formField({ value: '12345678901' })
      })
    })

    // Update data via setData
    model.setData({ name: 'Bob', contact: { email: 'bob@example.com', phone: '98765432109' } })

    expect(model.data).toEqual({
      name: 'Bob',
      contact: { email: 'bob@example.com', phone: '98765432109' }
    })

    // Reset data
    model.resetData()
    expect(model.data).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })
  })
})

describe('DynamicFormModel with Nested Fields', () => {
  it('should flatten fields and initialize data correctly', () => {
    const model = new DynamicFormModel({
      name: formField({ value: 'Alice' }),
      contact: nestField({
        email: formField({ value: 'alice@example.com' }),
        phone: formField({ value: '12345678901' })
      })
    })

    // Verify allKeys
    expect(model.allKeys).toEqual(['name', 'contact.email', 'contact.phone'])

    // Verify initialData and data
    expect(model.data).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })
    expect(model.initialData).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })
  })

  it('should support dynamic add and delete on nested fields', () => {
    const model = new DynamicFormModel({ name: formField({ value: 'Alice' }) })

    expect(model.allKeys).toEqual(['name'])

    // Dynamically add nested fields
    model.add(
      'contact',
      nestField({
        email: formField({ value: 'alice@example.com' }),
        phone: formField({ value: '12345678901' })
      })
    )

    expect(model.allKeys).toEqual(['name', 'contact.email', 'contact.phone'])
    expect(model.data).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })
    expect(model.initialData).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })

    // Dynamically delete nested fields
    model.delete('contact')

    expect(model.allKeys).toEqual(['name'])
    expect(model.data.name).toBe('Alice')
    expect(model.fields.contact).toBeUndefined()
  })

  it('should validate flat and nested fields correctly', async () => {
    const model = new DynamicFormModel()

    model.add('name', formField({ value: '', required: 'Name is required' }))
    model.add(
      'contact',
      nestField({
        email: formField({ value: 'invalid-email', preset: 'email' }),
        phone: formField({ value: '12345678901', required: true })
      })
    )

    // Expect initial validation to fail on name and contact.email
    await expect(model.validate()).resolves.toBe(false)
    expect(model.errors.get('name')).toEqual(['Name is required'])
    expect(model.errors.get('contact.email')).toEqual(['邮箱格式不正确'])
    expect(model.errors.get('contact.phone')).toBeUndefined()

    // Fix name and contact.email, and trigger validation
    model.data.name = 'Bob'
    model.data.contact.email = 'bob@example.com'

    const valid = await model.validate()
    expect(valid).toBe(true)
    expect(model.errors.size).toBe(0)
  })

  it('should set data and reset data correctly for nested fields', () => {
    const model = new DynamicFormModel({
      name: formField({ value: 'Alice' }),
      contact: nestField({
        email: formField({ value: 'alice@example.com' }),
        phone: formField({ value: '12345678901' })
      })
    })

    // Update data via setData
    model.setData({ name: 'Bob', contact: { email: 'bob@example.com', phone: '98765432109' } })

    expect(model.data).toEqual({
      name: 'Bob',
      contact: { email: 'bob@example.com', phone: '98765432109' }
    })

    // Reset data
    model.resetData()
    expect(model.data).toEqual({
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '12345678901' }
    })
  })
})
