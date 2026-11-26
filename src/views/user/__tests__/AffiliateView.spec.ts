import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AffiliateView from '../AffiliateView.vue'

const { copyToClipboard, getAffiliateDetail } = vi.hoisted(() => ({
  copyToClipboard: vi.fn(),
  getAffiliateDetail: vi.fn(),
}))

vi.mock('@/api/user', () => ({
  default: {
    getAffiliateDetail,
    transferAffiliateQuota: vi.fn(),
  },
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    refreshUser: vi.fn(),
  }),
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard }),
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  }
})

describe('AffiliateView', () => {
  const affiliateCode = 'affiliate-code-that-is-long-enough-to-overflow-a-mobile-viewport'

  beforeEach(() => {
    vi.clearAllMocks()
    copyToClipboard.mockResolvedValue(true)
    getAffiliateDetail.mockResolvedValue({
      user_id: 1,
      aff_code: affiliateCode,
      inviter_id: null,
      aff_count: 0,
      aff_quota: 0,
      aff_frozen_quota: 0,
      aff_history_quota: 0,
      effective_rebate_rate_percent: 10,
      invitees: [],
    })
  })

  it('stacks long values and copy controls on mobile while retaining desktop rows', async () => {
    const wrapper = mount(AffiliateView, {
      global: {
        stubs: {
          AppLayout: { template: '<main><slot /></main>' },
          Icon: true,
        },
      },
    })

    await flushPromises()

    const values = wrapper.findAll('code')
    expect(values).toHaveLength(2)
    // 新结构：邀请码 / 邀请链接各占一个 aff__field，长值与复制按钮同处一个 aff__valuebox。
    // 长值用 overflow-wrap/ellipsis 自我约束、按钮 flex-shrink:0，移动端不会把控件挤出可视区。
    expect(values[0].classes()).toContain('aff__code')
    expect(values[1].classes()).toContain('aff__link')
    expect(values[0].text()).toBe(affiliateCode)
    expect(values[1].text()).toContain(encodeURIComponent(affiliateCode))
    expect(wrapper.findAll('.aff__field')).toHaveLength(2)
    for (const value of values) {
      const box = value.element.parentElement
      expect(box?.classList.contains('aff__valuebox')).toBe(true)
      expect(box?.querySelectorAll('button')).toHaveLength(1)
    }

    const copyButtons = wrapper.findAll('button').filter((button) =>
      ['affiliate.copyCode', 'affiliate.copyLink'].includes(button.text()),
    )
    expect(copyButtons).toHaveLength(2)
    for (const button of copyButtons) {
      expect(button.classes()).toContain('st-btn')
      expect(button.element.parentElement?.classList.contains('aff__valuebox')).toBe(true)
    }

    await copyButtons[0].trigger('click')
    await copyButtons[1].trigger('click')
    await flushPromises()

    expect(copyToClipboard).toHaveBeenNthCalledWith(1, affiliateCode, 'affiliate.codeCopied')
    expect(copyToClipboard).toHaveBeenNthCalledWith(
      2,
      `${window.location.origin}/register?aff=${encodeURIComponent(affiliateCode)}`,
      'affiliate.linkCopied',
    )
  })
})
