import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlazaModelPricingTable from '../PlazaModelPricingTable.vue'
import type { PlazaModel } from '@/api/modelPlaza'

const { copyToClipboard } = vi.hoisted(() => ({
  copyToClipboard: vi.fn().mockResolvedValue(true)
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard })
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key
    })
  }
})

function tokenModel(overrides: Partial<PlazaModel> = {}): PlazaModel {
  return {
    name: 'claude-sonnet',
    platform: 'anthropic',
    pricing: {
      billing_mode: 'token',
      input_price: 3e-6,
      output_price: 1.5e-5,
      cache_write_price: 3.75e-6,
      cache_read_price: 3e-7,
      image_input_price: null,
      image_output_price: null,
      per_request_price: null,
      intervals: []
    },
    official_pricing: {
      input_price: 3e-6,
      output_price: 1.5e-5,
      cache_write_price: 3.75e-6,
      cache_write_1h_price: 6e-6,
      cache_read_price: 3e-7
    },
    ...overrides
  }
}

function mountTable(
  models: PlazaModel[],
  rateMultiplier: number,
  userRateMultiplier?: number | null,
  extraProps?: {
    imageRateIndependent?: boolean
    imageRateMultiplier?: number | null
    videoRateIndependent?: boolean
    videoRateMultiplier?: number | null
    peakWindow?: string
    peakRateMultiplier?: number | null
  }
) {
  return mount(PlazaModelPricingTable, {
    props: { models, rateMultiplier, userRateMultiplier: userRateMultiplier ?? null, ...extraProps }
  })
}

/** 卡片的模型名（按 DOM 顺序）。 */
function cardNames(wrapper: ReturnType<typeof mountTable>): string[] {
  return wrapper.findAll('[data-model-card]').map((card) => card.get('.pz-model__name').text())
}

function cardOf(wrapper: ReturnType<typeof mountTable>, name: string) {
  const card = wrapper.findAll('[data-model-card]').find((item) => item.get('.pz-model__name').text() === name)
  if (!card) throw new Error(`card not found: ${name}`)
  return card
}

describe('PlazaModelPricingTable（模型卡片）', () => {
  it('点击卡片上的复制按钮复制精确模型 ID', async () => {
    const model = tokenModel({
      name: 'provider/Model-v2',
      time_pricing: {
        timezone: 'Asia/Shanghai',
        periods: [{ start_time: '09:00', end_time: '12:00', multiplier: 0.5 }]
      }
    })
    const wrapper = mountTable([tokenModel(), model], 1)
    const card = cardOf(wrapper, model.name)

    await card.get('button[aria-label="modelPlaza.table.copyModelId"]').trigger('click')

    expect(copyToClipboard).toHaveBeenCalledTimes(1)
    expect(copyToClipboard).toHaveBeenCalledWith(model.name)
    // 分时时段在卡片内以时段展示
    expect(card.text()).toContain('09:00–12:00')
    wrapper.unmount()
  })

  it.each([false, true])('shows independent 12h prices without a 1h label (intervals=%s)', (intervals) => {
    const model = tokenModel({ name: 'gpt-6-luna', platform: 'openai' })
    model.pricing!.cache_write_price = null
    model.pricing!.cache_write_12h_price = 2e-6
    model.pricing!.cache_read_price = null
    model.official_pricing = { input_price: 1e-6, output_price: 5e-6, cache_write_price: null, cache_write_12h_price: 4e-6, cache_read_price: null }
    if (intervals) {
      model.pricing!.intervals = [{ min_tokens: 0, max_tokens: null, input_price: null, output_price: null, cache_write_price: null, cache_write_12h_price: 2e-6, cache_read_price: null, per_request_price: null }]
      model.official_pricing.intervals = [{ min_tokens: 0, max_tokens: null, input_price: 1e-6, output_price: 5e-6, cache_write_price: null, cache_write_12h_price: 4e-6, cache_read_price: null, per_request_price: null }]
    }
    const wrapper = mountTable([model], 0.5)
    try {
      expect(wrapper.text()).toContain('(12h $1.00)')
      expect(wrapper.text()).toContain('(12h $4.00)')
      expect(wrapper.text()).not.toContain('(1h')
    } finally {
      wrapper.unmount()
    }
  })

  it.each([
    { enabled: true, multiplier: 1, userRate: 0.05, expected: 1 },
    { enabled: true, multiplier: 0.5, userRate: null, expected: 0.5 },
    { enabled: true, multiplier: 0, userRate: 0.05, expected: 0 },
    { enabled: true, multiplier: -1, userRate: null, expected: 0 },
    { enabled: false, multiplier: 1, userRate: 0.05, expected: 0.05 },
    { enabled: false, multiplier: 1, userRate: null, expected: 0.15 }
  ])('uses the video billing multiplier $expected when independent=$enabled', (tc) => {
    const model = tokenModel({ name: 'video-test', official_pricing: null })
    model.pricing!.billing_mode = 'video'
    model.pricing!.per_request_price = 2
    const wrapper = mountTable([model], 0.15, tc.userRate, {
      imageRateIndependent: true,
      imageRateMultiplier: 9,
      videoRateIndependent: tc.enabled,
      videoRateMultiplier: tc.multiplier
    })
    try {
      expect(wrapper.text()).toContain(`$${(2 * tc.expected).toFixed(2)}`)
      const rateCell = wrapper.find('[data-rate]')
      if (tc.enabled) expect(rateCell.text()).toBe(`${tc.expected}x`)
      else expect(rateCell.text()).toContain(`${tc.expected}x`)
    } finally {
      wrapper.unmount()
    }
  })

  it('applies video independent rates to resolution tiers', () => {
    const model = tokenModel({ name: 'video-tier-test', official_pricing: null })
    model.pricing!.billing_mode = 'video'
    model.pricing!.intervals = [{
      min_tokens: 0, max_tokens: null, tier_label: '720p',
      input_price: null, output_price: null, cache_write_price: null,
      cache_read_price: null, per_request_price: 2
    }]
    const wrapper = mountTable([model], 0.15, 0.05, {
      videoRateIndependent: true, videoRateMultiplier: 0.5
    })
    expect(wrapper.text()).toContain('720p')
    expect(wrapper.text()).toContain('$1.00')
    wrapper.unmount()
  })

  it('倍率为 1 时展示渠道单价原值($/1M),价格保底 2 位小数', () => {
    const wrapper = mountTable([tokenModel()], 1)
    const text = wrapper.text()
    expect(text).toContain('$3.00')
    expect(text).toContain('$15.00')
    // 缓存写 / 读（超过 2 位小数原样保留）
    expect(text).toContain('$3.75')
    expect(text).toContain('$0.30')
    // 倍率
    expect(text).toContain('1x')
  })

  it('shows all configured reasoning multipliers in level order', () => {
    const model = tokenModel()
    model.pricing!.reasoning_effort_multipliers = { max: 3, none: 0.5, high: 1.5 }
    const wrapper = mountTable([model], 1)

    const badges = wrapper.findAll('[data-reasoning-effort]')
    expect(badges.map((badge) => badge.attributes('data-reasoning-effort'))).toEqual(['none', 'high', 'max'])
    expect(badges.every((badge) => badge.attributes('title') === 'modelPlaza.table.reasoningMultiplierHint')).toBe(true)
    expect(wrapper.text()).toContain('modelPlaza.table.reasoningMultiplierBadge')
  })

  it('does not show automatic reasoning charges for an unconfigured Fable model', () => {
    const wrapper = mountTable([tokenModel({ name: 'claude-fable-5-1' })], 1)
    expect(wrapper.find('[data-reasoning-effort]').exists()).toBe(false)
  })

  it('omits invalid or unsupported multipliers from display', () => {
    const model = tokenModel()
    model.pricing!.reasoning_effort_multipliers = { max: 0, high: Infinity, unknown: 2, low: 1 }
    const wrapper = mountTable([model], 1)
    expect(wrapper.findAll('[data-reasoning-effort]').map((badge) => badge.attributes('data-reasoning-effort'))).toEqual(['low'])
  })

  it('倍率 ≠ 1 时实付为折后价,官方参考价保持原价', () => {
    const wrapper = mountTable([tokenModel()], 0.5)
    const text = wrapper.text()
    expect(text).toContain('$1.50')
    expect(text).toContain('$7.50')
    expect(text).toContain('$3.00')
    expect(text).toContain('$15.00')
    expect(text).toContain('0.5x')
  })

  it('用户专属倍率覆盖分组倍率,并划线展示原倍率', () => {
    const wrapper = mountTable([tokenModel()], 1, 0.8)
    const text = wrapper.text()
    expect(text).toContain('$2.40')
    expect(text).toContain('$12.00')
    const struck = wrapper.find('.pz-model__rate-old')
    expect(struck.exists()).toBe(true)
    expect(struck.text()).toBe('1x')
    expect(text).toContain('0.8x')
  })

  it('模型按官方输出价从高到低排序,无官方价的排最后', () => {
    const expensive = tokenModel({
      name: 'model-expensive',
      official_pricing: {
        input_price: 1e-5,
        output_price: 7.5e-5,
        cache_write_price: null,
        cache_write_1h_price: null,
        cache_read_price: null
      }
    })
    const cheap = tokenModel({
      name: 'model-cheap',
      official_pricing: {
        input_price: 1e-6,
        output_price: 5e-6,
        cache_write_price: null,
        cache_write_1h_price: null,
        cache_read_price: null
      }
    })
    const noOfficial = tokenModel({ name: 'model-no-official', official_pricing: null })

    const wrapper = mountTable([cheap, noOfficial, expensive], 1)
    expect(cardNames(wrapper)).toEqual(['model-expensive', 'model-cheap', 'model-no-official'])
  })

  it('官方输出价相同时按模型名降序(新版本号在前)', () => {
    const older = tokenModel({ name: 'gpt-5.5' })
    const newer = tokenModel({ name: 'gpt-5.6-sol' })

    const wrapper = mountTable([older, newer], 1)
    expect(cardNames(wrapper)).toEqual(['gpt-5.6-sol', 'gpt-5.5'])
  })

  it('按图片/按次计费的模型沉到末尾,不与 token 模型按官方价混排', () => {
    const image = tokenModel({
      name: 'gpt-image-2',
      pricing: {
        billing_mode: 'image',
        input_price: null,
        output_price: null,
        cache_write_price: null,
        cache_read_price: null,
        image_input_price: null,
        image_output_price: null,
        per_request_price: 0.002,
        intervals: []
      },
      official_pricing: {
        input_price: 5e-6,
        output_price: 1e-5,
        cache_write_price: null,
        cache_write_1h_price: null,
        cache_read_price: 1.25e-6
      }
    })
    const pricier = tokenModel({
      name: 'gpt-5.6-terra',
      official_pricing: {
        input_price: 2.5e-6,
        output_price: 1.5e-5,
        cache_write_price: null,
        cache_write_1h_price: null,
        cache_read_price: null
      }
    })
    const cheaper = tokenModel({
      name: 'gpt-5.6-luna',
      official_pricing: {
        input_price: 1e-6,
        output_price: 6e-6,
        cache_write_price: null,
        cache_write_1h_price: null,
        cache_read_price: null
      }
    })

    const wrapper = mountTable([pricier, image, cheaper], 1)
    const names = cardNames(wrapper)
    expect(names[0]).toBe('gpt-5.6-terra')
    expect(names[1]).toBe('gpt-5.6-luna')
    expect(names[2]).toBe('gpt-image-2')
    // 非 token 计费在卡片上打「按图片计费」徽章
    expect(wrapper.text()).toContain('modelPlaza.table.perImage')
  })

  it('卡片同时展示实付价格与官方参考价', () => {
    const wrapper = mountTable([tokenModel()], 1)
    const text = wrapper.text()
    expect(text).toContain('modelPlaza.table.officialPrice')
    expect(text).toContain('modelPlaza.table.input')
    expect(text).toContain('modelPlaza.table.output')
    expect(wrapper.findAll('[data-model-card]')).toHaveLength(1)
  })

  it('官方价包含 1h 缓存写入价;official_pricing 为 null 时官方参考显示 -', () => {
    const withOfficial = mountTable([tokenModel()], 1)
    expect(withOfficial.text()).toContain('$6.00')
    expect(withOfficial.text()).toContain('(1h')

    const withoutOfficial = mountTable([tokenModel({ official_pricing: null })], 1)
    expect(withoutOfficial.find('.pz-official__val').text()).toBe('- / -')
  })

  it('实付价分别展示自定义 5m 与 1h 缓存写入价', () => {
    const model = tokenModel()
    model.pricing!.cache_write_1h_price = 7e-6

    const wrapper = mountTable([model], 1)
    expect(wrapper.text()).toContain('$3.75')
    expect(wrapper.text()).toContain('$7.00')
    expect(wrapper.text()).toContain('(1h')
  })

  it('per_request 模型按单次价 × 倍率展示,官方参考显示 -', () => {
    const model = tokenModel({
      name: 'search-tool',
      pricing: {
        billing_mode: 'per_request',
        input_price: null,
        output_price: null,
        cache_write_price: null,
        cache_read_price: null,
        image_input_price: null,
        image_output_price: null,
        per_request_price: 0.04,
        intervals: []
      },
      official_pricing: null
    })

    const wrapper = mountTable([model], 0.5)
    expect(wrapper.text()).toContain('$0.02')
    expect(wrapper.text()).toContain('modelPlaza.table.perUnitRequest')
    expect(wrapper.find('.pz-official__val').text()).toBe('- / -')
  })
})
