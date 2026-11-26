import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, shallowMount } from '@vue/test-utils'
import ChannelStatusV1View from '../ChannelStatusV1View.vue'

const mocks = vi.hoisted(() => ({ list: vi.fn(), status: vi.fn() }))
vi.mock('@/api/channelMonitor', () => mocks)
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ cachedPublicSettings: { channel_monitor_enabled: true }, showError: vi.fn() }) }))
vi.mock('vue-i18n', async () => ({
  ...await vi.importActual<typeof import('vue-i18n')>('vue-i18n'),
  useI18n: () => ({ t: (key: string) => key })
}))
enableAutoUnmount(afterEach)
afterEach(() => { vi.useRealTimers(); localStorage.clear() })

function detail(availability: number) {
  return { id: 1, models: [{ model: 'model', availability_15d: availability, availability_30d: availability }] }
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  localStorage.clear()
  localStorage.setItem('channel-status-auto-refresh', JSON.stringify({ enabled: true, interval_seconds: 30 }))
  mocks.list.mockImplementation(async () => ({ items: [{ id: 1, name: 'Monitor', primary_model: 'model', primary_status: 'operational', availability_7d: 99 }] }))
  mocks.status.mockResolvedValue(detail(90))
})

function mountView() {
  return shallowMount(ChannelStatusV1View, {
    global: { stubs: {
      // 新外壳 UserShell 需要保留默认插槽，页面内容才会渲染
      UserShell: { template: '<div><slot /></div>' },
      MonitorDetailDialog: true,
    } }
  })
}

const availabilityText = (wrapper: ReturnType<typeof mountView>) => wrapper.get('.board__avail-v').text()
const windowButton = (wrapper: ReturnType<typeof mountView>, label: string) => {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === label)
  if (!button) throw new Error(`window button not found: ${label}`)
  return button
}
const refreshButton = (wrapper: ReturnType<typeof mountView>) => wrapper.get('button[title="common.refresh"]')
const refreshReady = (wrapper: ReturnType<typeof mountView>) =>
  !(refreshButton(wrapper).element as HTMLButtonElement).disabled

describe('channel monitor automatic detail refresh', () => {
  it.each(['15d', '30d'])('refreshes the cached %s availability on timer ticks', async (windowLabel) => {
    const wrapper = mountView()
    await flushPromises()
    await windowButton(wrapper, windowLabel).trigger('click')
    await flushPromises()
    expect(availabilityText(wrapper)).toBe('90.0%')
    mocks.status.mockResolvedValue(detail(98))
    await vi.advanceTimersByTimeAsync(30000)
    await flushPromises()
    expect(availabilityText(wrapper)).toBe('98.0%')
    expect(mocks.status).toHaveBeenCalledTimes(2)
    expect(refreshReady(wrapper)).toBe(true)
  })

  it('keeps the seven-day view on the list endpoint without extra detail requests', async () => {
    const wrapper = mountView()
    await flushPromises()
    await vi.advanceTimersByTimeAsync(30000)
    await flushPromises()
    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(mocks.status).not.toHaveBeenCalled()
    expect(availabilityText(wrapper)).toBe('99.0%')
  })

  it('still refreshes cached availability on manual reload', async () => {
    const wrapper = mountView()
    await flushPromises()
    await windowButton(wrapper, '15d').trigger('click')
    await flushPromises()
    mocks.status.mockResolvedValue(detail(98))
    await refreshButton(wrapper).trigger('click')
    await flushPromises()
    expect(availabilityText(wrapper)).toBe('98.0%')
  })
})
