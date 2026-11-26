<template>
  <div class="st-root setup-page">
    <div class="setup-wrap">
      <header class="setup-head">
        <span class="setup-mark" aria-hidden="true">
          <Icon name="cog" size="xl" />
        </span>
        <p class="st-eyebrow">{{ c('setup.eyebrow') }}</p>
        <h1 class="st-display-2 setup-title">{{ t('setup.title') }}</h1>
        <p class="st-lede setup-lede">{{ t('setup.description') }}</p>
      </header>

      <ol class="setup-steps" aria-label="setup">
        <li
          v-for="(step, index) in steps"
          :key="step.id"
          class="setup-step"
          :class="{ 'setup-step--done': currentStep > index, 'setup-step--active': currentStep === index }"
        >
          <span class="setup-step__dot">
            <Icon v-if="currentStep > index" name="check" size="md" :stroke-width="2" />
            <span v-else class="st-num">{{ index + 1 }}</span>
          </span>
          <span class="setup-step__label">{{ step.title }}</span>
        </li>
      </ol>

      <!-- Step Content -->
      <div class="st-card setup-card">
        <!-- Step 1: Database -->
        <div v-if="currentStep === 0" class="setup-step-body">
          <div class="setup-step-head">
            <h2 class="st-display-3">{{ t('setup.database.title') }}</h2>
            <p class="setup-hint">{{ c('setup.stepHint.database') }}</p>
          </div>
          <div class="setup-grid">
            <div>
              <label class="st-label">{{ t('setup.database.host') }}</label>
              <input v-model="formData.database.host" type="text" class="st-input" placeholder="localhost" />
            </div>
            <div>
              <label class="st-label">{{ t('setup.database.port') }}</label>
              <input v-model.number="formData.database.port" type="number" class="st-input" placeholder="5432" />
            </div>
            <div>
              <label class="st-label">{{ t('setup.database.username') }}</label>
              <input v-model="formData.database.user" type="text" class="st-input" placeholder="postgres" />
            </div>
            <div>
              <label class="st-label">{{ t('setup.database.password') }}</label>
              <input
                v-model="formData.database.password"
                type="password"
                class="st-input"
                :placeholder="t('setup.database.passwordPlaceholder')"
              />
            </div>
            <div>
              <label class="st-label">{{ t('setup.database.databaseName') }}</label>
              <input v-model="formData.database.dbname" type="text" class="st-input" placeholder="sub2api" />
            </div>
            <div>
              <label class="st-label">{{ t('setup.database.sslMode') }}</label>
              <Select
                v-model="formData.database.sslmode"
                :options="[
                  { value: 'disable', label: t('setup.database.ssl.disable') },
                  { value: 'require', label: t('setup.database.ssl.require') },
                  { value: 'verify-ca', label: t('setup.database.ssl.verifyCa') },
                  { value: 'verify-full', label: t('setup.database.ssl.verifyFull') }
                ]"
              />
            </div>
          </div>

          <div class="setup-switch">
            <div class="setup-switch__copy">
              <p class="setup-switch__title">{{ t("setup.redis.enableTls") }}</p>
              <p class="setup-switch__hint">{{ t("setup.redis.enableTlsHint") }}</p>
            </div>
            <Toggle v-model="formData.redis.enable_tls" />
          </div>

          <button
            type="button"
            class="st-btn st-btn--quiet setup-test"
            :class="{ 'setup-test--ok': dbConnected }"
            :disabled="testingDb"
            @click="testDatabaseConnection"
          >
            <span v-if="testingDb" class="setup-spinner" aria-hidden="true"></span>
            <Icon v-else-if="dbConnected" name="check" size="md" :stroke-width="2" />
            <span>{{ testingDb ? t('setup.status.testing') : dbConnected ? t('setup.status.success') : t('setup.status.testConnection') }}</span>
          </button>
        </div>

        <!-- Step 2: Redis -->
        <div v-if="currentStep === 1" class="setup-step-body">
          <div class="setup-step-head">
            <h2 class="st-display-3">{{ t('setup.redis.title') }}</h2>
            <p class="setup-hint">{{ c('setup.stepHint.redis') }}</p>
          </div>
          <div class="setup-grid">
            <div>
              <label class="st-label">{{ t('setup.redis.host') }}</label>
              <input v-model="formData.redis.host" type="text" class="st-input" placeholder="localhost" />
            </div>
            <div>
              <label class="st-label">{{ t('setup.redis.port') }}</label>
              <input v-model.number="formData.redis.port" type="number" class="st-input" placeholder="6379" />
            </div>
            <div>
              <label class="st-label">{{ t('setup.redis.username') }}</label>
              <input
                v-model="formData.redis.username"
                type="text"
                class="st-input"
                :placeholder="t('setup.redis.usernamePlaceholder')"
              />
            </div>
            <div>
              <label class="st-label">{{ t('setup.redis.password') }}</label>
              <input
                v-model="formData.redis.password"
                type="password"
                class="st-input"
                :placeholder="t('setup.redis.passwordPlaceholder')"
              />
            </div>
            <div>
              <label class="st-label">{{ t('setup.redis.database') }}</label>
              <input v-model.number="formData.redis.db" type="number" class="st-input" placeholder="0" />
            </div>
          </div>

          <div class="setup-switch">
            <div class="setup-switch__copy">
              <p class="setup-switch__title">{{ t("setup.redis.enableTls") }}</p>
              <p class="setup-switch__hint">{{ t("setup.redis.enableTlsHint") }}</p>
            </div>
            <Toggle v-model="formData.redis.enable_tls" />
          </div>

          <button
            type="button"
            class="st-btn st-btn--quiet setup-test"
            :class="{ 'setup-test--ok': redisConnected }"
            :disabled="testingRedis"
            @click="testRedisConnection"
          >
            <span v-if="testingRedis" class="setup-spinner" aria-hidden="true"></span>
            <Icon v-else-if="redisConnected" name="check" size="md" :stroke-width="2" />
            <span>{{ testingRedis ? t('setup.status.testing') : redisConnected ? t('setup.status.success') : t('setup.status.testConnection') }}</span>
          </button>
        </div>

        <!-- Step 3: Admin -->
        <div v-if="currentStep === 2" class="setup-step-body">
          <div class="setup-step-head">
            <h2 class="st-display-3">{{ t('setup.admin.title') }}</h2>
            <p class="setup-hint">{{ c('setup.stepHint.admin') }}</p>
          </div>

          <div>
            <label class="st-label">{{ t('setup.admin.email') }}</label>
            <input
              v-model="formData.admin.email"
              type="email"
              class="st-input"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label class="st-label">{{ t('setup.admin.password') }}</label>
            <input
              v-model="formData.admin.password"
              type="password"
              class="st-input"
              :placeholder="t('setup.admin.passwordPlaceholder')"
            />
          </div>

          <div>
            <label class="st-label">{{ t('setup.admin.confirmPassword') }}</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="st-input"
              :placeholder="t('setup.admin.confirmPasswordPlaceholder')"
            />
            <p
              v-if="confirmPassword && formData.admin.password !== confirmPassword"
              class="setup-err"
            >
              {{ t('setup.admin.passwordMismatch') }}
            </p>
          </div>
        </div>

        <!-- Step 4: Complete -->
        <div v-if="currentStep === 3" class="setup-step-body">
          <div class="setup-step-head">
            <h2 class="st-display-3">{{ t('setup.ready.title') }}</h2>
            <p class="setup-hint">{{ c('setup.stepHint.complete') }}</p>
          </div>

          <dl class="setup-summary">
            <div class="setup-summary__item">
              <dt>{{ t('setup.ready.database') }}</dt>
              <dd>{{ formData.database.user }}@{{ formData.database.host }}:{{ formData.database.port }}/{{ formData.database.dbname }}</dd>
            </div>
            <div class="setup-summary__item">
              <dt>{{ t('setup.ready.redis') }}</dt>
              <dd>{{ formData.redis.host }}:{{ formData.redis.port }}</dd>
            </div>
            <div class="setup-summary__item">
              <dt>{{ t('setup.ready.adminEmail') }}</dt>
              <dd>{{ formData.admin.email }}</dd>
            </div>
          </dl>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="setup-alert setup-alert--bad" role="alert">
          <Icon name="exclamationCircle" size="md" />
          <p class="setup-alert__text">{{ errorMessage }}</p>
        </div>

        <div v-if="installSuccess" class="setup-alert setup-alert--ok" role="status">
          <span v-if="!serviceReady" class="setup-spinner" aria-hidden="true"></span>
          <Icon v-else name="checkCircle" size="md" />
          <div>
            <p class="setup-alert__title">{{ t('setup.status.completed') }}</p>
            <p class="setup-alert__text">{{ serviceReady ? t('setup.status.redirecting') : t('setup.status.restarting') }}</p>
          </div>
        </div>

        <div class="setup-nav">
          <button
            v-if="currentStep > 0 && !installSuccess"
            type="button"
            class="st-btn st-btn--quiet"
            @click="currentStep--"
          >
            <Icon name="chevronLeft" size="sm" :stroke-width="2" />
            {{ t('common.back') }}
          </button>
          <span v-else aria-hidden="true"></span>

          <button
            v-if="currentStep < 3"
            type="button"
            class="st-btn st-btn--primary"
            :disabled="!canProceed"
            @click="nextStep"
          >
            {{ t('common.next') }}
            <Icon name="chevronRight" size="sm" :stroke-width="2" />
          </button>

          <button
            v-else-if="!installSuccess"
            type="button"
            class="st-btn st-btn--primary"
            :disabled="installing"
            @click="performInstall"
          >
            <span v-if="installing" class="setup-spinner" aria-hidden="true"></span>
            {{ installing ? t('setup.status.installing') : t('setup.status.completeInstallation') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { testDatabase, testRedis, install, type InstallRequest } from '@/api/setup'
import { buildGatewayUrl } from '@/api/client'
import Select from '@/components/common/Select.vue'
import Toggle from '@/components/common/Toggle.vue'
import Icon from '@/components/icons/Icon.vue'
import { useMiscCopy } from '@/composables/copy/misc'

const { t } = useI18n()
const { c } = useMiscCopy()

const steps = computed(() => [
  { id: 'database', title: t('setup.database.title') },
  { id: 'redis', title: t('setup.redis.title') },
  { id: 'admin', title: t('setup.admin.title') },
  { id: 'complete', title: t('setup.ready.title') }
])

const currentStep = ref(0)
const errorMessage = ref('')
const installSuccess = ref(false)

// Connection test states
const testingDb = ref(false)
const testingRedis = ref(false)
const dbConnected = ref(false)
const redisConnected = ref(false)
const installing = ref(false)
const confirmPassword = ref('')
const serviceReady = ref(false)

// Default server port
const getCurrentPort = (): number => {
  const port = window.location.port
  if (port) {
    return parseInt(port, 10)
  }

  return window.location.protocol === 'https:' ? 443 : 80
}

const formData = reactive<InstallRequest>({
  database: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    dbname: 'sub2api',
    sslmode: 'disable'
  },
  redis: {
    host: 'localhost',
    port: 6379,
    username: '',
    password: '',
    db: 0,
    enable_tls: false
  },
  admin: {
    email: '',
    password: ''
  },
  server: {
    host: '0.0.0.0',
    port: getCurrentPort(), // Use current port from browser
    mode: 'release'
  }
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return dbConnected.value
    case 1:
      return redisConnected.value
    case 2:
      return (
        formData.admin.email &&
        formData.admin.password.length >= 8 &&
        formData.admin.password === confirmPassword.value
      )
    default:
      return true
  }
})

async function testDatabaseConnection() {
  testingDb.value = true
  errorMessage.value = ''
  dbConnected.value = false

  try {
    await testDatabase(formData.database)
    dbConnected.value = true
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value =
      err.response?.data?.detail || err.response?.data?.message || err.message || 'Connection failed'
  } finally {
    testingDb.value = false
  }
}

async function testRedisConnection() {
  testingRedis.value = true
  errorMessage.value = ''
  redisConnected.value = false

  try {
    await testRedis(formData.redis)
    redisConnected.value = true
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value =
      err.response?.data?.detail || err.response?.data?.message || err.message || 'Connection failed'
  } finally {
    testingRedis.value = false
  }
}

function nextStep() {
  if (canProceed.value) {
    errorMessage.value = ''
    currentStep.value++
  }
}

async function performInstall() {
  installing.value = true
  errorMessage.value = ''

  try {
    await install(formData)
    installSuccess.value = true
    // Start polling for service restart
    waitForServiceRestart()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
    errorMessage.value =
      err.response?.data?.detail || err.response?.data?.message || err.message || 'Installation failed'
  } finally {
    installing.value = false
  }
}

// Wait for service to restart and become available
async function waitForServiceRestart() {
  const maxAttempts = 60 // Increase to 60 attempts, ~60 seconds max
  const interval = 1000 // 1 second between attempts

  // Wait a moment for the service to start restarting
  await new Promise((resolve) => setTimeout(resolve, 3000))

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use setup status endpoint as it tells us the real mode
      // Service might return 404 or connection refused while restarting
      const response = await fetch(buildGatewayUrl('/setup/status'), {
        method: 'GET',
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        // If needs_setup is false, service has restarted in normal mode
        if (data.data && !data.data.needs_setup) {
          serviceReady.value = true
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
      }
    } catch {
      // Service not ready or network error during restart, continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  // If we reach here, service didn't restart in time
  // Show a message to refresh manually
  errorMessage.value = t('setup.status.timeout')
}
</script>

<style scoped>
.setup-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(28px, 5vw, 64px) var(--st-gutter);
  background: var(--st-bg);
  color: var(--st-ink);
  font-family: var(--st-font-body);
}
.setup-wrap { width: 100%; max-width: 640px; }

.setup-head { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; margin-bottom: clamp(24px, 3.4vw, 36px); }
.setup-mark {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 6px;
  border-radius: var(--st-r-lg);
  border: 1px solid var(--st-brand-line);
  background: var(--st-brand-soft);
  color: var(--st-brand-text);
}
.setup-title { margin-top: 2px; }
.setup-lede { max-width: 46ch; }

.setup-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0 0 clamp(20px, 3vw, 30px);
  padding: 0;
  list-style: none;
}
.setup-step { position: relative; display: flex; flex-direction: column; align-items: center; gap: 7px; min-width: 0; text-align: center; }
.setup-step:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 13px;
  left: calc(50% + 18px);
  right: calc(-50% + 18px);
  height: 1px;
  background: var(--st-line);
}
.setup-step--done:not(:last-child)::after { background: var(--st-brand-line); }
.setup-step__dot {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--st-line-2);
  background: var(--st-bg);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--st-ink-3);
}
.setup-step--active .setup-step__dot { border-color: var(--st-brand); background: var(--st-brand); color: var(--st-brand-ink); box-shadow: 0 0 0 4px var(--st-brand-soft); }
.setup-step--done .setup-step__dot { border-color: var(--st-brand-line); background: var(--st-bg); color: var(--st-brand-text); }
.setup-step__label { font-size: 0.72rem; line-height: 1.35; color: var(--st-ink-3); overflow-wrap: anywhere; }
.setup-step--active .setup-step__label,
.setup-step--done .setup-step__label { color: var(--st-ink); }

.setup-card { padding: clamp(20px, 3.2vw, 34px); }
.setup-step-body { display: flex; flex-direction: column; gap: 20px; }
.setup-step-head { display: flex; flex-direction: column; gap: 6px; }
.setup-hint { font-size: 0.82rem; color: var(--st-ink-3); }

.setup-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 12px; }
.setup-grid > div { min-width: 0; }

.setup-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border-radius: var(--st-r-sm);
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
}
.setup-switch__copy { min-width: 0; }
.setup-switch__title { font-size: 0.85rem; font-weight: 600; color: var(--st-ink); }
.setup-switch__hint { margin-top: 2px; font-size: 0.76rem; line-height: 1.55; color: var(--st-ink-3); }

.setup-test { width: 100%; }
.setup-test--ok { border-color: var(--st-brand-line); background: var(--st-brand-soft); color: var(--st-brand-text); }

.setup-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--st-line-2);
  border-top-color: var(--st-brand);
  animation: setup-spin 800ms linear infinite;
}
@keyframes setup-spin { to { transform: rotate(360deg); } }

.setup-err { margin-top: 6px; font-size: 0.78rem; color: var(--st-danger); }

.setup-summary { display: flex; flex-direction: column; gap: 10px; margin: 0; }
.setup-summary__item { padding: 12px 14px; border-radius: var(--st-r-sm); border: 1px solid var(--st-line); background: var(--st-bg-soft); }
.setup-summary__item dt { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--st-ink-3); }
.setup-summary__item dd { margin: 4px 0 0; font-size: 0.88rem; color: var(--st-ink); overflow-wrap: anywhere; }

.setup-alert { display: flex; align-items: flex-start; gap: 10px; margin-top: 22px; padding: 12px 14px; border-radius: var(--st-r-sm); }
.setup-alert--bad { background: var(--st-danger-soft); color: var(--st-danger); }
.setup-alert--ok { background: var(--st-brand-soft); color: var(--st-brand-text); }
.setup-alert__title { font-size: 0.85rem; font-weight: 600; color: var(--st-ink); }
.setup-alert__text { font-size: 0.82rem; line-height: 1.6; overflow-wrap: anywhere; }
.setup-alert > svg { flex-shrink: 0; margin-top: 2px; }

.setup-nav { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-top: clamp(24px, 3vw, 34px); }
.setup-nav .st-btn { flex: 1 1 auto; min-width: 0; }
@media (max-width: 560px) {
  .setup-grid { grid-template-columns: 1fr; }
  .setup-step__label { font-size: 0.66rem; }
}
@media (max-width: 480px) {
  .setup-nav .st-btn { flex: 1 1 100%; }
}
</style>
