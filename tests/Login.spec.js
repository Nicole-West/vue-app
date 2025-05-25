import { mount, flushPromises } from '@vue/test-utils'
import Login from '../src/views/Login.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

describe('Login.vue', () => {
  let wrapper
  let routerPushMock

  beforeEach(async () => {
    // Мокаем router
    const routes = [{ path: '/my', name: 'My' }, { path: '/admin', name: 'Admin' }]
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    routerPushMock = vi.spyOn(router, 'push')

    wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })

    // Мокаем fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGUiOiJ1c2VyIn0.dummy'
        })
      })
    )

    localStorage.clear()
  })

  it('Отображает форму', () => {
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button').text()).toContain('Войти')
  })

  it('выполняет логин и переходит на /my', async () => {
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('123456')
    await wrapper.find('button').trigger('click')

    await flushPromises()

    // Проверяем fetch вызов
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: '123456' })
    }))

    // Проверяем localStorage
    expect(localStorage.getItem('token')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGUiOiJ1c2VyIn0.dummy')
    expect(localStorage.getItem('userId')).toBe('123')
    expect(localStorage.getItem('name')).toBe('Test User')
    expect(localStorage.getItem('role')).toBe('user')

    // Проверяем редирект
    expect(routerPushMock).toHaveBeenCalledWith('/my')
  })

  it('показывает alert при ошибке логина', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Неверные данные' })
      })
    )
    window.alert = vi.fn()

    await wrapper.find('input[type="email"]').setValue('fail@example.com')
    await wrapper.find('input[type="password"]').setValue('wrongpass')
    await wrapper.find('button').trigger('click')

    await flushPromises()

    expect(window.alert).toHaveBeenCalledWith('Неверные данные')
    expect(routerPushMock).not.toHaveBeenCalled()
  })
})
