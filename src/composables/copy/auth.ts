/**
 * Auth 页面文案
 * 只改这个文件里的内容；不要动 src/i18n/locales 下的既有 key。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Dict = Record<string, string>

const zh: Dict = {
  'auth.tab.login': '登录',
  'auth.tab.register': '注册',
  // 左侧品牌叙事
  'auth.aside.eyebrow': '统一入口',
  'auth.aside.title1': '一个通行证，',
  'auth.aside.title2': '接入所有主流 AI 模型',
  'auth.aside.lede':
    '把 Claude、GPT、Gemini、Grok 放在同一个入口。拿到密钥后改一行代码就能换模型，账单和用量都在一个地方看。',
  'auth.aside.fact1': '一个账号，接入多家上游',
  'auth.aside.fact2': '密钥集中管理，随时吊销',
  'auth.aside.fact3': '用量与账单一眼看清',

  // 登录
  'auth.login.eyebrow': '登录',
  'auth.login.title': '回到你的工作台',
  'auth.login.lede': '输入邮箱和密码，继续用已经配好的模型与额度。',
  'auth.login.or': '或者用这些方式',
  'auth.login.submit': '登录',
  'auth.login.submitting': '正在登录…',
  'auth.login.passkey': '用通行密钥登录',
  'auth.login.passkeyBusy': '正在验证…',

  // 注册
  'auth.register.eyebrow': '开通通行证',
  'auth.register.title': '创建你的通行证',
  'auth.register.lede': '填好邮箱和密码，几十秒后就能拿到第一把密钥。',
  'auth.register.submit': '创建账号',
  'auth.register.submitting': '正在创建…',
  'auth.register.haveAccount': '已经有账号了？',
  'auth.register.goLogin': '直接登录',

  // 注册关闭
  'auth.closed.eyebrow': '暂时关闭注册',
  'auth.closed.title': '现在还不能开新账号',
  'auth.closed.lede': '管理员暂时关闭了自助注册。已有的账号照常使用，额度与调用都不受影响。',
  'auth.closed.point1': '已有账号直接登录，一切照旧',
  'auth.closed.point2': '需要新账号可以找站点管理员开通',
  'auth.closed.point3': '想先了解产品，回首页看看支持哪些模型',
  'auth.closed.goLogin': '去登录',
  'auth.closed.contact': '联系管理员：',

  // 找回 / 重置密码
  'auth.forgot.eyebrow': '找回通行证',
  'auth.forgot.title': '把重置链接寄给你',
  'auth.forgot.lede': '填注册时用的邮箱，链接几分钟内就能收到。',
  'auth.reset.eyebrow': '重置密码',
  'auth.reset.title': '设一个新密码',
  'auth.reset.lede': '新密码生效后，旧密码立刻作废。',

  // 邮箱验证
  'auth.verify.eyebrow': '还差一步',
  'auth.verify.title': '确认是你的邮箱',
  'auth.verify.lede': '输入收到的验证码，账号就开通了。',

  // 回调页通用
  'auth.callback.working': '正在接通',
  'auth.callback.workingHint': '正在和上游确认身份，通常只要一两秒。',
  'auth.callback.success': '接通了',
  'auth.callback.successHint': '正在把你送到工作台。',
  'auth.callback.failed': '这一步没走通',
  'auth.callback.failedHint': '可以回到登录页重试一次。',
  'auth.callback.backToLogin': '回到登录',
  'auth.callback.retry': '再试一次',

  // 通用小字
  'auth.shell.legal': '登录即表示同意我们按隐私政策处理你的账号信息。',
  'auth.shell.backHome': '回到首页',
}

const en: Dict = {
  'auth.tab.login': 'Sign in',
  'auth.tab.register': 'Sign up',
  'auth.aside.eyebrow': 'ONE ENDPOINT',
  'auth.aside.title1': 'One key,',
  'auth.aside.title2': 'every major AI model',
  'auth.aside.lede':
    'Claude, GPT, Gemini and Grok behind a single endpoint. Switch models by changing one line, and see usage and billing in one place.',
  'auth.aside.fact1': 'One account, many upstreams',
  'auth.aside.fact2': 'Keys managed in one place, revocable anytime',
  'auth.aside.fact3': 'Usage and billing at a glance',

  'auth.login.eyebrow': 'SIGN IN',
  'auth.login.title': 'Back to your workspace',
  'auth.login.lede': 'Email and password, and you are back with your models and credit.',
  'auth.login.or': 'or continue with',
  'auth.login.submit': 'Sign in',
  'auth.login.submitting': 'Signing in…',
  'auth.login.passkey': 'Sign in with a passkey',
  'auth.login.passkeyBusy': 'Verifying…',

  'auth.register.eyebrow': 'GET A KEY',
  'auth.register.title': 'Create your key',
  'auth.register.lede': 'An email and a password, and your first key is ready in seconds.',
  'auth.register.submit': 'Create account',
  'auth.register.submitting': 'Creating…',
  'auth.register.haveAccount': 'Already have an account?',
  'auth.register.goLogin': 'Sign in',

  'auth.closed.eyebrow': 'REGISTRATION CLOSED',
  'auth.closed.title': 'New sign-ups are paused',
  'auth.closed.lede': 'Self-service registration is temporarily off. Existing accounts keep working exactly as before.',
  'auth.closed.point1': 'Sign in with your existing account as usual',
  'auth.closed.point2': 'Ask the site admin to create a new account for you',
  'auth.closed.point3': 'Curious first? The home page lists the supported models',
  'auth.closed.goLogin': 'Go to sign in',
  'auth.closed.contact': 'Contact admin: ',

  'auth.forgot.eyebrow': 'RECOVER',
  'auth.forgot.title': 'We will email you a reset link',
  'auth.forgot.lede': 'Use the email you signed up with — the link arrives in a couple of minutes.',
  'auth.reset.eyebrow': 'RESET PASSWORD',
  'auth.reset.title': 'Set a new password',
  'auth.reset.lede': 'The old password stops working the moment this one is saved.',

  'auth.verify.eyebrow': 'ONE MORE STEP',
  'auth.verify.title': 'Confirm your email',
  'auth.verify.lede': 'Enter the code we sent you and your account is ready.',

  'auth.callback.working': 'Connecting',
  'auth.callback.workingHint': 'Confirming your identity with the provider — usually one or two seconds.',
  'auth.callback.success': 'Connected',
  'auth.callback.successHint': 'Taking you to your workspace.',
  'auth.callback.failed': 'That step did not go through',
  'auth.callback.failedHint': 'Head back to sign in and try once more.',
  'auth.callback.backToLogin': 'Back to sign in',
  'auth.callback.retry': 'Try again',

  'auth.shell.legal': 'By signing in you agree to our handling of your account data under the privacy policy.',
  'auth.shell.backHome': 'Back to home',
}

export function useAuthCopy() {
  const i18n = useI18n() as unknown as { locale?: { value?: string } | string }
  const dict = computed<Dict>(() => {
    const raw = i18n && typeof i18n.locale === 'object' && i18n.locale !== null ? i18n.locale.value : i18n?.locale
    const lang = String(raw ?? 'zh').toLowerCase()
    return lang.startsWith('zh') ? zh : en
  })
  const c = (key: string) => dict.value[key] ?? zh[key] ?? key
  return { c }
}