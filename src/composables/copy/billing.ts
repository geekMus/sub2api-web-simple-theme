/**
 * Billing 页面文案
 * 只改这个文件里的内容；不要动 src/i18n/locales 下的既有 key。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Dict = Record<string, string>

const zh: Dict = {
  // 在这里补充中文文案，key 用 'billing.xxx'
}

const en: Dict = {
  // English copy here, same keys
}

export function useBillingCopy() {
  const { locale } = useI18n()
  const dict = computed<Dict>(() => (String(locale.value).toLowerCase().startsWith('zh') ? zh : en))
  const c = (key: string) => dict.value[key] ?? zh[key] ?? key
  return { c }
}
