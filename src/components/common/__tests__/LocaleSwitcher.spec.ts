import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LocaleSwitcher from '../LocaleSwitcher.vue'

const { setLocale } = vi.hoisted(() => ({ setLocale: vi.fn() }))

vi.mock('@/i18n', () => ({
  setLocale,
  availableLocales: [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ]
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'zh' } }) }))

const reload = vi.fn()

const mountSwitcher = () =>
  mount(LocaleSwitcher, { global: { stubs: { Icon: true, transition: false } } })

const choose = async (wrapper: ReturnType<typeof mountSwitcher>, name: string) => {
  await wrapper.get('button').trigger('click')
  const option = wrapper.findAll('button').find((button) => button.text().includes(name))
  await option!.trigger('click')
  await flushPromises()
}

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    setLocale.mockReset().mockResolvedValue(undefined)
    reload.mockReset()
    vi.stubGlobal('location', { ...window.location, reload })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 切换语言必须即时生效：只调用 setLocale（i18n locale 是响应式的），不得刷新页面
  it('switches language in place without reloading the page', async () => {
    const wrapper = mountSwitcher()

    await choose(wrapper, 'English')

    expect(setLocale).toHaveBeenCalledWith('en')
    expect(reload).not.toHaveBeenCalled()
  })

  it('does nothing when the current language is chosen again', async () => {
    const wrapper = mountSwitcher()

    await choose(wrapper, '中文')

    expect(setLocale).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
