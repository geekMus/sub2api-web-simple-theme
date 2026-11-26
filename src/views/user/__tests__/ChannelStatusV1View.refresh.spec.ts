import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChannelStatusV1View from '../ChannelStatusV1View.vue'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/api/channelMonitor', () => ({ list, status: vi.fn() }))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ cachedPublicSettings: { channel_monitor_enabled: true }, showError: vi.fn() }) }))
vi.mock('vue-i18n', async () => ({
  ...await vi.importActual<typeof import('vue-i18n')>('vue-i18n'),
  useI18n: () => ({ t: (key: string) => key }),
}))
const mountView = () => shallowMount(ChannelStatusV1View, {
  global: { stubs: {
    // 新外壳 UserShell 需要保留默认插槽，页面内容才会渲染
    UserShell: { template: '<div><slot /></div>' },
    MonitorDetailDialog: true,
  } },
})
const autoRefreshToggle = (wrapper: ReturnType<typeof mountView>) => {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes('Auto refresh'))
  if (!button) throw new Error('auto refresh toggle not found')
  return button
}
const refreshButton = (wrapper: ReturnType<typeof mountView>) => wrapper.get('button[title="common.refresh"]')
let wrapper: ReturnType<typeof mountView>
beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); list.mockReset().mockResolvedValue({ items: [] }) })
afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); localStorage.clear() })

describe('channel monitor refresh interval', () => {
  it('keeps automatic refresh disabled after reopening the page', async () => {
    wrapper = mountView(); await flushPromises()
    await autoRefreshToggle(wrapper).trigger('click')
    wrapper.unmount()
    wrapper = mountView(); await flushPromises()
    const calls = list.mock.calls.length
    await vi.advanceTimersByTimeAsync(240000)
    expect(list).toHaveBeenCalledTimes(calls)
    expect(JSON.parse(localStorage.getItem('channel-status-auto-refresh')!).enabled).toBe(false)
    await refreshButton(wrapper).trigger('click'); await flushPromises()
    expect(list).toHaveBeenCalledTimes(calls + 1)
  })

  it('starts automatic refresh for a first visit', async () => {
    wrapper = mountView(); await flushPromises()
    await vi.advanceTimersByTimeAsync(120000)
    expect(list.mock.calls.length).toBeGreaterThan(1)
  })

  it('refreshes on successive automatic refreshes at the configured cadence', async () => {
    // 新界面不提供间隔选择器：通过持久化配置（与首次访问的默认值一致）驱动刷新节奏
    localStorage.setItem('channel-status-auto-refresh', JSON.stringify({ enabled: true, interval_seconds: 120 }))
    wrapper = mountView(); await flushPromises()
    await vi.advanceTimersByTimeAsync(119000)
    expect(list).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(list).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(119000)
    expect(list).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1000)
    expect(list).toHaveBeenCalledTimes(3)
  })

  it('preserves the refresh cadence after a manual refresh', async () => {
    localStorage.setItem('channel-status-auto-refresh', JSON.stringify({ enabled: true, interval_seconds: 120 }))
    wrapper = mountView(); await flushPromises()
    await refreshButton(wrapper).trigger('click'); await flushPromises()
    expect(list).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(119000)
    expect(list).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1000)
    expect(list).toHaveBeenCalledTimes(3)
  })

  it('honors a persisted interval after the initial load', async () => {
    localStorage.setItem('channel-status-auto-refresh', JSON.stringify({ enabled: true, interval_seconds: 120 }))
    wrapper = mountView(); await flushPromises()
    await vi.advanceTimersByTimeAsync(119000)
    expect(list).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(list).toHaveBeenCalledTimes(2)
    await autoRefreshToggle(wrapper).trigger('click')
    await vi.advanceTimersByTimeAsync(120000)
    expect(list).toHaveBeenCalledTimes(2)
  })
})
