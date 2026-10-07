import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage } from 'element-plus'

const { push, doLogin } = vi.hoisted(() => ({ push: vi.fn(), doLogin: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ doLogin }) }))

import LoginView from '@/views/auth/LoginView.vue'

const mountLogin = () => mount(LoginView, { global: { plugins: [ElementPlus] }, attachTo: document.body })
const fill = async (wrapper, username, password) => {
  const [u, p] = wrapper.findAll('input')
  await u.setValue(username)
  await p.setValue(password)
}
const submit = async (wrapper) => {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('LoginView', () => {
  beforeEach(() => {
    push.mockReset()
    doLogin.mockReset()
    vi.spyOn(ElMessage, 'error').mockImplementation(() => {})
  })

  it('has a real submit button, so Enter in a field submits the form', () => {
    expect(mountLogin().find('button[type="submit"]').exists()).toBe(true)
  })

  it('lets password managers fill the fields', () => {
    const [u, p] = mountLogin().findAll('input')
    expect(u.attributes('autocomplete')).toBe('username')
    expect(p.attributes('autocomplete')).toBe('current-password')
  })

  it('logs in and goes to the dashboard', async () => {
    doLogin.mockResolvedValue()
    const w = mountLogin()
    await fill(w, 'admin', 'secret')
    await submit(w)
    expect(doLogin).toHaveBeenCalledWith('admin', 'secret')
    expect(push).toHaveBeenCalledWith('/dashboard')
  })

  it('does not call the API when fields are empty', async () => {
    const w = mountLogin()
    await submit(w)
    expect(doLogin).not.toHaveBeenCalled()
  })

  it('on 401 shows the generic message and clears the password', async () => {
    doLogin.mockRejectedValue({ response: { status: 401, data: { message: 'User admin not found' } } })
    const w = mountLogin()
    await fill(w, 'admin', 'wrong')
    await submit(w)
    expect(ElMessage.error).toHaveBeenCalledWith('Username atau password salah.')
    expect(w.findAll('input')[1].element.value).toBe('')
  })

  it('ignores two submits fired in the same tick', async () => {
    doLogin.mockResolvedValue()
    const w = mountLogin()
    await fill(w, 'admin', 'secret')
    const form = w.find('form')
    form.trigger('submit')
    form.trigger('submit')
    await flushPromises()
    expect(doLogin).toHaveBeenCalledTimes(1)
  })

  it('stays locked after success while the dashboard is still loading', async () => {
    doLogin.mockResolvedValue()
    push.mockReturnValue(new Promise(() => {})) // dashboard chunk never finishes
    const w = mountLogin()
    await fill(w, 'admin', 'secret')
    await submit(w)
    await submit(w)
    expect(doLogin).toHaveBeenCalledTimes(1)
  })

  it('unlocks again after a failed login so the user can retry', async () => {
    doLogin.mockRejectedValueOnce({ response: { status: 401 } }).mockResolvedValueOnce()
    const w = mountLogin()
    await fill(w, 'admin', 'wrong')
    await submit(w)
    await fill(w, 'admin', 'right')
    await submit(w)
    expect(doLogin).toHaveBeenCalledTimes(2)
  })

  it('ignores a second submit while the first is still running', async () => {
    let finish
    doLogin.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const w = mountLogin()
    await fill(w, 'admin', 'secret')
    await submit(w)
    await submit(w)
    expect(doLogin).toHaveBeenCalledTimes(1)
    finish()
    await flushPromises()
  })
})
