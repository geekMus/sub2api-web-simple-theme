<template>
  <UserShell>
    <section class="st-section keys">
      <div class="st-shell keys__inner">
        <header class="keys__head">
          <div class="keys__head-copy">
            <p class="st-eyebrow st-reveal">{{ c('usercore.keys.eyebrow') }}</p>
            <h1 class="st-display-2 keys__title st-reveal" style="--i: 1">{{ c('usercore.keys.title') }}</h1>
            <p class="st-lede keys__lede st-reveal" style="--i: 2">{{ c('usercore.keys.lede') }}</p>
          </div>
          <div class="keys__head-actions st-reveal" style="--i: 3">
            <span class="st-pill">{{ c('usercore.keys.countLabel', { count: pagination.total }) }}</span>
            <button type="button" class="st-btn st-btn--primary" data-tour="keys-create-btn" @click="showCreateModal = true">
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
                <path d="M10 4.5v11M4.5 10h11" stroke-linecap="round" />
              </svg>
              {{ c('usercore.keys.create') }}
            </button>
          </div>
        </header>

        <div class="keys__toolbar st-reveal" style="--i: 4">
          <div class="keys__search">
            <SearchInput v-model="filterSearch" :placeholder="c('usercore.keys.search')" @search="onFilterChange" />
          </div>
          <div class="keys__filter">
            <Select :model-value="filterGroupId" :options="groupFilterOptions" @update:model-value="onGroupFilterChange" />
          </div>
          <div class="keys__filter">
            <Select :model-value="filterStatus" :options="statusFilterOptions" @update:model-value="onStatusFilterChange" />
          </div>
          <div class="st-seg keys__sortseg" role="group" :aria-label="c('usercore.keys.sort')">
            <button type="button" class="st-seg__item" :class="{ 'st-seg__item--active': sortState.sort_by === 'created_at' && sortState.sort_order === 'desc' }" @click="handleSort('created_at', 'desc')">{{ c('usercore.keys.sortNewest') }}</button>
            <button type="button" class="st-seg__item" :class="{ 'st-seg__item--active': sortState.sort_by === 'created_at' && sortState.sort_order === 'asc' }" @click="handleSort('created_at', 'asc')">{{ c('usercore.keys.sortOldest') }}</button>
            <button type="button" class="st-seg__item" :class="{ 'st-seg__item--active': sortState.sort_by === 'current_concurrency' }" @click="handleSort('current_concurrency', 'asc')">{{ c('usercore.keys.sortConcurrency') }}</button>
          </div>
          <div class="keys__toolbar-end">
            <EndpointPopover
              v-if="publicSettings?.api_base_url || (publicSettings?.custom_endpoints?.length ?? 0) > 0"
              :api-base-url="publicSettings?.api_base_url || ''"
              :custom-endpoints="publicSettings?.custom_endpoints || []"
            />
            <div ref="columnDropdownRef" class="keys__cols">
              <button type="button" class="st-icon-btn" :title="t('keys.columnSettings')" @click="showColumnDropdown = !showColumnDropdown">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <path d="M9 4.5v15M15 4.5v15M4.5 4.5h15v15h-15z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <div v-if="showColumnDropdown" class="keys__cols-menu">
                <p class="keys__cols-title">{{ c('usercore.keys.columnSettings') }} · {{ columns.length }}/{{ allColumns.length }}</p>
                <button
                  v-for="col in toggleableColumns"
                  :key="col.key"
                  type="button"
                  class="keys__cols-item"
                  @click="toggleColumn(col.key)"
                >
                  <span>{{ col.label }}</span>
                  <Icon v-if="isColumnVisible(col.key)" name="check" size="sm" :stroke-width="2" class="keys__cols-check" />
                </button>
              </div>
            </div>
            <button type="button" class="st-icon-btn" :title="t('common.refresh')" :disabled="loading" @click="loadApiKeys">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" :class="{ 'keys__spin': loading }" aria-hidden="true">
                <path d="M4 12a8 8 0 1 1 2.6 5.9M4 17v-4.4h4.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="selectedIds.length" class="keys__bulk">
          <span class="keys__bulk-count">{{ c('usercore.keys.selected', { count: selectedIds.length }) }}</span>
          <button type="button" class="st-btn st-btn--primary st-btn--sm" :disabled="loading" data-test="bulk-edit-keys" @click="showBulkEditModal = true">
            {{ c('usercore.keys.bulkEdit') }}
          </button>
          <button type="button" class="st-btn st-btn--ghost st-btn--sm" @click="selectedIds = []">{{ c('usercore.keys.clearSelection') }}</button>
        </div>

        <!-- 加载骨架 -->
        <div v-if="loading && apiKeys.length === 0" class="keys__grid">
          <div v-for="i in 6" :key="i" class="st-card st-card--pad keys__skeleton">
            <span class="st-skeleton keys__sk-line keys__sk-line--lg"></span>
            <span class="st-skeleton keys__sk-line"></span>
            <span class="st-skeleton keys__sk-line keys__sk-line--sm"></span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="apiKeys.length === 0" class="keys__empty" data-test="keys-empty">
          <svg class="keys__empty-art" viewBox="0 0 220 140" width="220" height="140" fill="none" aria-hidden="true">
            <rect x="26" y="34" width="120" height="76" rx="16" stroke="var(--st-line-strong)" stroke-width="1.5" />
            <path d="M26 62h120" stroke="var(--st-line-strong)" stroke-width="1.5" />
            <circle cx="44" cy="48" r="3" fill="var(--st-line-strong)" />
            <circle cx="56" cy="48" r="3" fill="var(--st-line-strong)" />
            <rect x="44" y="76" width="52" height="7" rx="3.5" fill="var(--st-accent-soft)" />
            <rect x="44" y="90" width="34" height="7" rx="3.5" fill="var(--st-line)" />
            <circle cx="168" cy="52" r="18" stroke="var(--st-accent-line)" stroke-width="1.5" />
            <path d="M160 52h16M168 44v16" stroke="var(--st-accent)" stroke-width="1.8" stroke-linecap="round" />
            <path d="M78 120c10-8 22-8 32 0 10-8 22-8 32 0" stroke="var(--st-line-strong)" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <h2 class="st-display-3 keys__empty-title">
            {{ filterSearch || filterStatus || filterGroupId !== '' ? c('usercore.keys.emptyFilteredTitle') : c('usercore.keys.emptyTitle') }}
          </h2>
          <p class="st-body keys__empty-body">
            {{ filterSearch || filterStatus || filterGroupId !== '' ? c('usercore.keys.emptyFilteredBody') : c('usercore.keys.emptyBody') }}
          </p>
          <button
            v-if="filterSearch || filterStatus || filterGroupId !== ''"
            type="button"
            class="st-btn st-btn--quiet"
            data-test="clear-filters"
            @click="filterSearch = ''; filterStatus = ''; filterGroupId = ''; onFilterChange()"
          >
            {{ c('usercore.keys.emptyFilteredCta') }}
          </button>
          <button v-else type="button" class="st-btn st-btn--primary" data-test="keys-empty-cta" @click="showCreateModal = true">
            {{ c('usercore.keys.emptyCta') }}
          </button>
        </div>

        <!-- 通行证卡片网格 -->
        <div v-else class="keys__grid">
          <article
            v-for="(row, index) in apiKeys"
            :key="row.id"
            class="st-card st-card--pad st-card--lift keys__card st-reveal"
            :style="{ '--i': index }"
            data-test="key-card"
            :data-key-id="row.id"
          >
            <header class="keys__card-head">
              <label class="keys__select">
                <input
                  type="checkbox"
                  data-test="key-select"
                  :checked="selectedIds.includes(row.id)"
                  :aria-label="t('keys.bulkEdit.selectKey', { name: row.name })"
                  @change="handleSelectionChange(($event.target as HTMLInputElement).checked ? [...selectedIds, row.id] : selectedIds.filter((id) => id !== row.id))"
                />
              </label>
              <span class="keys__name" :title="row.name">{{ row.name }}</span>
              <Icon v-if="row.ip_whitelist?.length > 0 || row.ip_blacklist?.length > 0" name="shield" size="sm" class="keys__shield" :title="t('keys.ipRestrictionEnabled')" />
              <span v-if="isColumnVisible('id')" class="keys__id st-num" data-test="key-id">#{{ row.id }}</span>
              <span class="keys__status" :class="'keys__status--' + row.status">
                <span class="keys__status-dot" aria-hidden="true"></span>
                {{ t('keys.status.' + row.status) }}
              </span>
            </header>

            <button type="button" class="keys__key" :title="copiedKeyId === row.id ? t('keys.copied') : t('keys.copyToClipboard')" @click="copyToClipboard(row.key, row.id)">
              <code class="st-code keys__key-code">{{ maskApiKey(row.key) }}</code>
              <span class="keys__copy" :class="{ 'keys__copy--done': copiedKeyId === row.id }">
                <Icon v-if="copiedKeyId === row.id" name="check" size="sm" :stroke-width="2" />
                <Icon v-else name="clipboard" size="sm" />
                <span class="keys__copy-label">{{ copiedKeyId === row.id ? t('keys.copied') : t('keys.copyToClipboard') }}</span>
              </span>
            </button>

            <dl class="keys__facts">
              <div class="keys__fact">
                <dt>{{ c('usercore.keys.todaySpend') }}</dt>
                <dd data-test="usage">
                  <template v-if="usageLoading && !usageStats[row.id]">
                    <span data-test="usage-pending" class="st-skeleton keys__pending"></span>
                  </template>
                  <template v-else>
                    <span class="st-num">${{ (usageStats[row.id]?.today_actual_cost ?? 0).toFixed(4) }}</span>
                    <span class="keys__fact-sub st-num">/ ${{ (usageStats[row.id]?.total_actual_cost ?? 0).toFixed(4) }}</span>
                  </template>
                </dd>
              </div>
              <div class="keys__fact">
                <dt>{{ c('usercore.keys.concurrency') }}</dt>
                <dd><span data-test="current-concurrency" class="st-num">{{ row.current_concurrency ?? 0 }}</span></dd>
              </div>
              <div class="keys__fact">
                <dt>{{ c('usercore.keys.expires') }}</dt>
                <dd class="keys__fact-muted" :class="{ 'keys__fact-danger': row.expires_at && new Date(row.expires_at) < new Date() }">
                  {{ row.expires_at ? formatDateTime(row.expires_at) : c('usercore.keys.noExpiry') }}
                </dd>
              </div>
              <div v-if="isColumnVisible('last_used_at')" class="keys__fact">
                <dt>{{ t('keys.lastUsedAt') }}</dt>
                <dd class="keys__fact-muted">{{ row.last_used_at ? formatDateTime(row.last_used_at) : '-' }}</dd>
              </div>
              <div v-if="isColumnVisible('created_at')" class="keys__fact">
                <dt>{{ t('keys.created') }}</dt>
                <dd class="keys__fact-muted">{{ formatDateTime(row.created_at) }}</dd>
              </div>
              <div v-if="isColumnVisible('last_used_ip')" class="keys__fact">
                <dt>{{ t('keys.lastUsedIP') }}</dt>
                <dd class="keys__fact-muted" data-test="last-used-ip">{{ row.last_used_ip || '-' }}</dd>
              </div>
            </dl>

            <div v-if="row.quota > 0" class="keys__quota">
              <div class="keys__quota-line">
                <span>{{ c('usercore.keys.quota') }}</span>
                <span class="st-num" :class="{ 'keys__fact-danger': row.quota_used >= row.quota }">
                  ${{ row.quota_used?.toFixed(2) || '0.00' }} / ${{ row.quota?.toFixed(2) }}
                </span>
              </div>
              <div class="keys__bar">
                <span
                  class="keys__bar-fill"
                  :class="{ 'keys__bar-fill--off': row.quota_used >= row.quota, 'keys__bar-fill--warn': row.quota_used < row.quota && row.quota_used >= row.quota * 0.8 }"
                  :style="{ width: Math.min((row.quota_used / row.quota) * 100, 100) + '%' }"
                ></span>
              </div>
            </div>

            <div v-if="isColumnVisible('rate_limit')" class="keys__ratelimit">
              <template v-if="row.rate_limit_5h > 0 || row.rate_limit_1d > 0 || row.rate_limit_7d > 0">
                <div v-for="w in (['5h', '1d', '7d'] as const)" :key="w">
                  <template v-if="(w === '5h' ? row.rate_limit_5h : w === '1d' ? row.rate_limit_1d : row.rate_limit_7d) > 0">
                    <div class="keys__quota-line">
                      <span>{{ w }}</span>
                      <span class="st-num">
                        ${{ (w === '5h' ? row.usage_5h : w === '1d' ? row.usage_1d : row.usage_7d)?.toFixed(2) || '0.00' }}/${{ (w === '5h' ? row.rate_limit_5h : w === '1d' ? row.rate_limit_1d : row.rate_limit_7d)?.toFixed(2) }}
                      </span>
                    </div>
                    <div class="keys__bar">
                      <span
                        class="keys__bar-fill"
                        :style="{ width: Math.min(((w === '5h' ? row.usage_5h : w === '1d' ? row.usage_1d : row.usage_7d) / (w === '5h' ? row.rate_limit_5h : w === '1d' ? row.rate_limit_1d : row.rate_limit_7d)) * 100, 100) + '%' }"
                      ></span>
                    </div>
                    <p v-if="formatResetTime(w === '5h' ? row.reset_5h_at : w === '1d' ? row.reset_1d_at : row.reset_7d_at)" class="keys__rl-reset">⟳ {{ formatResetTime(w === '5h' ? row.reset_5h_at : w === '1d' ? row.reset_1d_at : row.reset_7d_at) }}</p>
                  </template>
                </div>
                <button
                  v-if="row.usage_5h > 0 || row.usage_1d > 0 || row.usage_7d > 0"
                  type="button"
                  class="keys__textbtn"
                  :title="t('keys.resetRateLimitUsage')"
                  @click.stop="confirmResetRateLimitFromTable(row)"
                >
                  {{ t('keys.resetUsage') }}
                </button>
              </template>
            </div>

            <footer class="keys__card-foot">
              <button type="button" class="keys__group-btn" :ref="(el) => setGroupButtonRef(row.id, el)" :title="t('keys.clickToChangeGroup')" @click="openGroupSelector(row)">
                <GroupBadge
                  v-if="row.group"
                  :name="row.group.name"
                  :platform="row.group.platform"
                  :subscription-type="row.group.subscription_type"
                  :rate-multiplier="row.group.rate_multiplier"
                  :user-rate-multiplier="userGroupRates[row.group.id]"
                  :peak-rate-enabled="row.group.peak_rate_enabled"
                  :peak-start="row.group.peak_start"
                  :peak-end="row.group.peak_end"
                  :peak-rate-multiplier="row.group.peak_rate_multiplier"
                />
                <span v-else class="keys__group-empty">{{ t('keys.noGroup') }}</span>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" class="keys__group-caret" aria-hidden="true">
                  <path d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <div class="keys__actions">
                <button type="button" class="keys__action" :title="t('keys.useKey')" @click="openUseKeyModal(row)">
                  <Icon name="terminal" size="sm" />
                  <span class="sr-only">{{ t('keys.useKey') }}</span>
                </button>
                <button v-if="!publicSettings?.hide_ccs_import_button" type="button" class="keys__action" :title="t('keys.importToCcSwitch')" @click="importToCcswitch(row)">
                  <Icon name="upload" size="sm" />
                  <span class="sr-only">{{ t('keys.importToCcSwitch') }}</span>
                </button>
                <button type="button" class="keys__action" :title="row.status === 'active' ? t('keys.disable') : t('keys.enable')" @click="toggleKeyStatus(row)">
                  <Icon v-if="row.status === 'active'" name="ban" size="sm" />
                  <Icon v-else name="checkCircle" size="sm" />
                  <span class="sr-only">{{ row.status === 'active' ? t('keys.disable') : t('keys.enable') }}</span>
                </button>
                <button type="button" class="keys__action" :title="t('common.edit')" @click="editKey(row)">
                  <Icon name="edit" size="sm" />
                  <span class="sr-only">{{ t('common.edit') }}</span>
                </button>
                <button type="button" class="keys__action keys__action--danger" :title="t('common.delete')" @click="confirmDelete(row)">
                  <Icon name="trash" size="sm" />
                  <span class="sr-only">{{ t('common.delete') }}</span>
                </button>
              </div>
            </footer>
          </article>
        </div>

        <div v-if="pagination.total > 0" class="keys__pager">
          <Pagination
            :page="pagination.page"
            :total="pagination.total"
            :page-size="pagination.page_size"
            @update:page="handlePageChange"
            @update:pageSize="handlePageSizeChange"
          />
        </div>
      </div>
    </section>


    <!-- Create/Edit Modal -->
    <BaseDialog
      :show="showCreateModal || showEditModal"
      :title="showEditModal ? t('keys.editKey') : t('keys.createKey')"
      width="normal"
      @close="closeModals"
    >
      <form id="key-form" @submit.prevent="handleSubmit" class="keys-stack keys-stack--loose">
        <div>
          <label class="st-label">{{ t('keys.nameLabel') }}</label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="st-input"
            :placeholder="t('keys.namePlaceholder')"
            data-tour="key-form-name"
          />
        </div>

        <fieldset v-if="!showEditModal" data-tour="key-form-provider">
          <legend class="st-label">{{ t('keys.providerLabel') }}</legend>
          <div class="keys-providers">
            <label
              v-for="provider in createProviderOptions"
              :key="provider.value"
              class="keys-provider"
              :class="{
                'keys-provider--on': createProvider === provider.value,
                'keys-provider--off': provider.count === 0
              }"
            >
              <input
                type="radio"
                name="key-provider"
                :value="provider.value"
                :checked="createProvider === provider.value"
                :disabled="provider.count === 0"
                class="keys-provider__input"
                @change="selectCreateProvider(provider.value)"
              />
              <span class="keys-provider__icons" aria-hidden="true">
                <span
                  v-for="platform in KEY_GROUP_PROVIDER_ICONS[provider.value]"
                  :key="platform"
                  class="keys-provider__ico"
                  :class="platformBadgeLightClass(platform)"
                >
                  <PlatformIcon :platform="platform" size="lg" />
                </span>
              </span>
              <span class="keys-provider__label">{{ provider.label }}</span>
            </label>
          </div>
          <p class="keys-hint" aria-live="polite">
            {{ groups.length === 0 ? t('common.noGroupsAvailable') : t(`keys.providerHints.${createProvider}`) }}
          </p>
        </fieldset>

        <div>
          <label class="st-label" for="key-form-group">{{ t('keys.groupLabel') }}</label>
          <Select
            :key="showEditModal ? 'edit' : createProvider"
            id="key-form-group"
            :aria-label="t('keys.groupLabel')"
            v-model="formData.group_id"
            :options="formGroupOptions"
            :placeholder="t('keys.selectGroup')"
            :empty-text="t('common.noGroupsAvailable')"
            :searchable="true"
            :search-placeholder="t('keys.searchGroup')"
            data-tour="key-form-group"
          >
            <template #selected="{ option }">
              <GroupBadge
                v-if="option"
                :name="(option as unknown as GroupOption).label"
                :platform="(option as unknown as GroupOption).platform"
                :subscription-type="(option as unknown as GroupOption).subscriptionType"
                :rate-multiplier="(option as unknown as GroupOption).rate"
                :user-rate-multiplier="(option as unknown as GroupOption).userRate"
                :peak-rate-enabled="(option as unknown as GroupOption).peakRateEnabled"
                :peak-start="(option as unknown as GroupOption).peakStart"
                :peak-end="(option as unknown as GroupOption).peakEnd"
                :peak-rate-multiplier="(option as unknown as GroupOption).peakRateMultiplier"
              />
              <span v-else class="keys-hint">{{ t('keys.selectGroup') }}</span>
            </template>
            <template #option="{ option, selected }">
              <GroupOptionItem
                :name="(option as unknown as GroupOption).label"
                :platform="(option as unknown as GroupOption).platform"
                :subscription-type="(option as unknown as GroupOption).subscriptionType"
                :rate-multiplier="(option as unknown as GroupOption).rate"
                :user-rate-multiplier="(option as unknown as GroupOption).userRate"
                :peak-rate-enabled="(option as unknown as GroupOption).peakRateEnabled"
                :peak-start="(option as unknown as GroupOption).peakStart"
                :peak-end="(option as unknown as GroupOption).peakEnd"
                :peak-rate-multiplier="(option as unknown as GroupOption).peakRateMultiplier"
                :description="(option as unknown as GroupOption).description"
                :selected="selected"
              />
            </template>
          </Select>
        </div>

        <!-- Custom Key Section (only for create) -->
        <div v-if="!showEditModal" class="keys-stack keys-stack--tight">
          <div class="keys-switch-row">
            <label class="st-label keys__label-inline">{{ t('keys.customKeyLabel') }}</label>
            <button type="button" role="switch" :aria-checked="formData.use_custom_key" class="keys-switch" :class="{ 'keys-switch--on': formData.use_custom_key }" @click="formData.use_custom_key = !formData.use_custom_key"><span class="keys-switch__knob" aria-hidden="true"></span></button>
          </div>
          <div v-if="formData.use_custom_key">
            <input
              v-model="formData.custom_key"
              type="text"
              class="st-input keys__mono"
              :placeholder="t('keys.customKeyPlaceholder')"
              :class="{ 'border-red-500 dark:border-red-500': customKeyError }"
            />
            <p v-if="customKeyError" class="keys-hint keys-hint--danger">{{ customKeyError }}</p>
            <p v-else class="keys__hint">{{ t('keys.customKeyHint') }}</p>
          </div>
        </div>

        <div v-if="showEditModal">
          <label class="st-label">{{ t('keys.statusLabel') }}</label>
          <Select
            v-model="formData.status"
            :options="statusOptions"
            :placeholder="t('keys.selectStatus')"
          />
        </div>

        <!-- IP Restriction Section -->
        <div class="keys-stack keys-stack--tight">
          <div class="keys-switch-row">
            <label class="st-label keys__label-inline">{{ t('keys.ipRestriction') }}</label>
            <button type="button" role="switch" :aria-checked="formData.enable_ip_restriction" class="keys-switch" :class="{ 'keys-switch--on': formData.enable_ip_restriction }" @click="formData.enable_ip_restriction = !formData.enable_ip_restriction"><span class="keys-switch__knob" aria-hidden="true"></span></button>
          </div>

          <div v-if="formData.enable_ip_restriction" class="keys-stack">
            <div>
              <label class="st-label">{{ t('keys.ipWhitelist') }}</label>
              <textarea
                v-model="formData.ip_whitelist"
                rows="3"
                class="st-input keys__mono"
                :placeholder="t('keys.ipWhitelistPlaceholder')"
              />
              <p class="keys__hint">{{ t('keys.ipWhitelistHint') }}</p>
            </div>

            <div>
              <label class="st-label">{{ t('keys.ipBlacklist') }}</label>
              <textarea
                v-model="formData.ip_blacklist"
                rows="3"
                class="st-input keys__mono"
                :placeholder="t('keys.ipBlacklistPlaceholder')"
              />
              <p class="keys__hint">{{ t('keys.ipBlacklistHint') }}</p>
            </div>
          </div>
        </div>

        <!-- Quota Limit Section -->
        <div class="keys-stack keys-stack--tight">
          <label class="st-label">{{ t('keys.quotaLimit') }}</label>
          <!-- Switch commented out - always show input, 0 = unlimited
          <div class="keys-switch-row">
            <label class="st-label keys__label-inline">{{ t('keys.quotaLimit') }}</label>
            <button type="button" role="switch" :aria-checked="formData.enable_quota" class="keys-switch" :class="{ 'keys-switch--on': formData.enable_quota }" @click="formData.enable_quota = !formData.enable_quota"><span class="keys-switch__knob" aria-hidden="true"></span></button>
          </div>
          -->

          <div class="keys-stack">
            <div>
              <div class="keys-prefixwrap">
                <span class="keys-prefix">$</span>
                <input
                  v-model.number="formData.quota"
                  type="number"
                  step="0.01"
                  min="0"
                  class="st-input keys__pl"
                  :placeholder="t('keys.quotaAmountPlaceholder')"
                />
              </div>
              <p class="keys__hint">{{ t('keys.quotaAmountHint') }}</p>
            </div>

            <!-- Quota used display (only in edit mode) -->
            <div v-if="showEditModal && selectedKey && selectedKey.quota > 0">
              <label class="st-label">{{ t('keys.quotaUsed') }}</label>
              <div class="keys-usage__row">
                <div class="keys__usage-box">
                  <span class="keys-usage__now st-num">
                    ${{ selectedKey.quota_used?.toFixed(4) || '0.0000' }}
                  </span>
                  <span class="keys-usage__sep">/</span>
                  <span class="keys-usage__max st-num">
                    ${{ selectedKey.quota?.toFixed(2) || '0.00' }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="confirmResetQuota"
                  class="st-btn st-btn--quiet st-btn--sm"
                  :title="t('keys.resetQuotaUsed')"
                >
                  {{ t('keys.reset') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Rate Limit Section -->
        <div class="keys-stack keys-stack--tight">
          <div class="keys-switch-row">
            <label class="st-label keys__label-inline">{{ t('keys.rateLimitSection') }}</label>
            <button type="button" role="switch" :aria-checked="formData.enable_rate_limit" class="keys-switch" :class="{ 'keys-switch--on': formData.enable_rate_limit }" @click="formData.enable_rate_limit = !formData.enable_rate_limit"><span class="keys-switch__knob" aria-hidden="true"></span></button>
          </div>

          <div v-if="formData.enable_rate_limit" class="keys-stack">
            <p class="keys__hint">{{ t('keys.rateLimitHint') }}</p>
            <!-- 5-Hour Limit -->
            <div>
              <label class="st-label">{{ t('keys.rateLimit5h') }}</label>
              <div class="keys-prefixwrap">
                <span class="keys-prefix">$</span>
                <input
                  v-model.number="formData.rate_limit_5h"
                  type="number"
                  step="0.01"
                  min="0"
                  class="st-input keys__pl"
                  :placeholder="'0'"
                />
              </div>
              <!-- Usage info (edit mode only) -->
              <div v-if="showEditModal && selectedKey && selectedKey.rate_limit_5h > 0" class="mt-2">
                <div class="keys-usage__row">
                  <div class="keys__usage-box">
                    <span :class="[
                      'keys-usage__now st-num',
                      selectedKey.usage_5h >= selectedKey.rate_limit_5h ? 'keys-usage__now--danger' :
                      selectedKey.usage_5h >= selectedKey.rate_limit_5h * 0.8 ? 'keys-usage__now--warn' :
                      'keys-usage__now'
                    ]">
                      ${{ selectedKey.usage_5h?.toFixed(4) || '0.0000' }}
                    </span>
                    <span class="keys-usage__sep">/</span>
                    <span class="keys-usage__max st-num">
                      ${{ selectedKey.rate_limit_5h?.toFixed(2) || '0.00' }}
                    </span>
                  </div>
                </div>
                <div class="keys__bar">
                  <div
                    :class="[
                      'keys__bar-fill',
                      selectedKey.usage_5h >= selectedKey.rate_limit_5h ? 'keys__bar-fill--off' :
                      selectedKey.usage_5h >= selectedKey.rate_limit_5h * 0.8 ? 'keys__bar-fill--warn' :
                      'keys__bar-fill--ok'
                    ]"
                    :style="{ width: Math.min((selectedKey.usage_5h / selectedKey.rate_limit_5h) * 100, 100) + '%' }"
                  />
                </div>
              </div>
            </div>

            <!-- Daily Limit -->
            <div>
              <label class="st-label">{{ t('keys.rateLimit1d') }}</label>
              <div class="keys-prefixwrap">
                <span class="keys-prefix">$</span>
                <input
                  v-model.number="formData.rate_limit_1d"
                  type="number"
                  step="0.01"
                  min="0"
                  class="st-input keys__pl"
                  :placeholder="'0'"
                />
              </div>
              <!-- Usage info (edit mode only) -->
              <div v-if="showEditModal && selectedKey && selectedKey.rate_limit_1d > 0" class="mt-2">
                <div class="keys-usage__row">
                  <div class="keys__usage-box">
                    <span :class="[
                      'keys-usage__now st-num',
                      selectedKey.usage_1d >= selectedKey.rate_limit_1d ? 'keys-usage__now--danger' :
                      selectedKey.usage_1d >= selectedKey.rate_limit_1d * 0.8 ? 'keys-usage__now--warn' :
                      'keys-usage__now'
                    ]">
                      ${{ selectedKey.usage_1d?.toFixed(4) || '0.0000' }}
                    </span>
                    <span class="keys-usage__sep">/</span>
                    <span class="keys-usage__max st-num">
                      ${{ selectedKey.rate_limit_1d?.toFixed(2) || '0.00' }}
                    </span>
                  </div>
                </div>
                <div class="keys__bar">
                  <div
                    :class="[
                      'keys__bar-fill',
                      selectedKey.usage_1d >= selectedKey.rate_limit_1d ? 'keys__bar-fill--off' :
                      selectedKey.usage_1d >= selectedKey.rate_limit_1d * 0.8 ? 'keys__bar-fill--warn' :
                      'keys__bar-fill--ok'
                    ]"
                    :style="{ width: Math.min((selectedKey.usage_1d / selectedKey.rate_limit_1d) * 100, 100) + '%' }"
                  />
                </div>
              </div>
            </div>

            <!-- 7-Day Limit -->
            <div>
              <label class="st-label">{{ t('keys.rateLimit7d') }}</label>
              <div class="keys-prefixwrap">
                <span class="keys-prefix">$</span>
                <input
                  v-model.number="formData.rate_limit_7d"
                  type="number"
                  step="0.01"
                  min="0"
                  class="st-input keys__pl"
                  :placeholder="'0'"
                />
              </div>
              <!-- Usage info (edit mode only) -->
              <div v-if="showEditModal && selectedKey && selectedKey.rate_limit_7d > 0" class="mt-2">
                <div class="keys-usage__row">
                  <div class="keys__usage-box">
                    <span :class="[
                      'keys-usage__now st-num',
                      selectedKey.usage_7d >= selectedKey.rate_limit_7d ? 'keys-usage__now--danger' :
                      selectedKey.usage_7d >= selectedKey.rate_limit_7d * 0.8 ? 'keys-usage__now--warn' :
                      'keys-usage__now'
                    ]">
                      ${{ selectedKey.usage_7d?.toFixed(4) || '0.0000' }}
                    </span>
                    <span class="keys-usage__sep">/</span>
                    <span class="keys-usage__max st-num">
                      ${{ selectedKey.rate_limit_7d?.toFixed(2) || '0.00' }}
                    </span>
                  </div>
                </div>
                <div class="keys__bar">
                  <div
                    :class="[
                      'keys__bar-fill',
                      selectedKey.usage_7d >= selectedKey.rate_limit_7d ? 'keys__bar-fill--off' :
                      selectedKey.usage_7d >= selectedKey.rate_limit_7d * 0.8 ? 'keys__bar-fill--warn' :
                      'keys__bar-fill--ok'
                    ]"
                    :style="{ width: Math.min((selectedKey.usage_7d / selectedKey.rate_limit_7d) * 100, 100) + '%' }"
                  />
                </div>
              </div>
            </div>

            <!-- Reset Rate Limit button (edit mode only) -->
            <div v-if="showEditModal && selectedKey && (selectedKey.rate_limit_5h > 0 || selectedKey.rate_limit_1d > 0 || selectedKey.rate_limit_7d > 0)">
              <button
                type="button"
                @click="confirmResetRateLimit"
                class="st-btn st-btn--quiet st-btn--sm"
              >
                {{ t('keys.resetRateLimitUsage') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Expiration Section -->
        <div class="keys-stack keys-stack--tight">
          <div class="keys-switch-row">
            <label class="st-label keys__label-inline">{{ t('keys.expiration') }}</label>
            <button type="button" role="switch" :aria-checked="formData.enable_expiration" class="keys-switch" :class="{ 'keys-switch--on': formData.enable_expiration }" @click="formData.enable_expiration = !formData.enable_expiration"><span class="keys-switch__knob" aria-hidden="true"></span></button>
          </div>

          <div v-if="formData.enable_expiration" class="keys-stack">
            <!-- Quick select buttons (for both create and edit mode) -->
            <div class="keys-chips">
              <button
                v-for="days in ['7', '30', '90']"
                :key="days"
                type="button"
                @click="setExpirationDays(parseInt(days))"
                :class="[
                  'keys-chip',
                  formData.expiration_preset === days
                    ? 'keys-chip--on'
                    : ''
                ]"
              >
                {{ showEditModal ? t('keys.extendDays', { days }) : t('keys.expiresInDays', { days }) }}
              </button>
              <button
                type="button"
                @click="formData.expiration_preset = 'custom'"
                :class="[
                  'keys-chip',
                  formData.expiration_preset === 'custom'
                    ? 'keys-chip--on'
                    : ''
                ]"
              >
                {{ t('keys.customDate') }}
              </button>
            </div>

            <!-- Date picker (always show for precise adjustment) -->
            <div>
              <label class="st-label">{{ t('keys.expirationDate') }}</label>
              <input
                v-model="formData.expiration_date"
                type="datetime-local"
                class="st-input"
              />
              <p class="keys__hint">{{ t('keys.expirationDateHint') }}</p>
            </div>

            <!-- Current expiration display (only in edit mode) -->
            <div v-if="showEditModal && selectedKey?.expires_at" class="keys-note">
              <span class="keys-note__label">{{ t('keys.currentExpiration') }}: </span>
              <span class="keys-usage__now st-num">
                {{ formatDateTime(selectedKey.expires_at) }}
              </span>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <div class="keys-form-actions">
          <button @click="closeModals" type="button" class="st-btn st-btn--quiet">
            {{ t('common.cancel') }}
          </button>
          <button
            form="key-form"
            type="submit"
            :disabled="submitting"
            class="st-btn st-btn--primary"
            data-tour="key-form-submit"
          >
            <svg
              v-if="submitting"
              class="keys__spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{
              submitting
                ? t('keys.saving')
                : showEditModal
                  ? t('common.update')
                  : t('common.create')
            }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <BulkEditKeysModal
      :show="showBulkEditModal"
      :selected-keys="selectedApiKeys"
      :groups="groups"
      @close="showBulkEditModal = false"
      @updated="handleBulkUpdated"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('keys.deleteKey')"
      :message="t('keys.deleteConfirmMessage', { name: selectedKey?.name })"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      :danger="true"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />

    <!-- Reset Quota Confirmation Dialog -->
    <ConfirmDialog
      :show="showResetQuotaDialog"
      :title="t('keys.resetQuotaTitle')"
      :message="t('keys.resetQuotaConfirmMessage', { name: selectedKey?.name, used: selectedKey?.quota_used?.toFixed(4) })"
      :confirm-text="t('keys.reset')"
      :cancel-text="t('common.cancel')"
      :danger="true"
      @confirm="resetQuotaUsed"
      @cancel="showResetQuotaDialog = false"
    />

    <!-- Reset Rate Limit Confirmation Dialog -->
    <ConfirmDialog
      :show="showResetRateLimitDialog"
      :title="t('keys.resetRateLimitTitle')"
      :message="t('keys.resetRateLimitConfirmMessage', { name: selectedKey?.name })"
      :confirm-text="t('keys.reset')"
      :cancel-text="t('common.cancel')"
      :danger="true"
      @confirm="resetRateLimitUsage"
      @cancel="showResetRateLimitDialog = false"
    />

    <!-- Use Key Modal -->
    <UseKeyModal
      :show="showUseKeyModal"
      :api-key="selectedKey?.key || ''"
      :base-url="publicSettings?.api_base_url || ''"
      :platform="selectedKey?.group?.platform || null"
      :claude-code-only="selectedKey?.group?.claude_code_only || false"
      :allow-messages-dispatch="selectedKey?.group?.allow_messages_dispatch || false"
      @close="closeUseKeyModal"
    />

    <!-- CCS Client Selection Dialog for Antigravity -->
    <BaseDialog
      :show="showCcsClientSelect"
      :title="t('keys.ccsClientSelect.title')"
      width="narrow"
      @close="closeCcsClientSelect"
    >
      <div class="keys-stack">
        <p class="st-body">
          {{ t('keys.ccsClientSelect.description') }}
	        </p>
	        <div class="keys-ccs-grid">
	          <button
	            @click="handleCcsClientSelect('claude')"
	            class="keys-ccs"
	          >
	            <Icon name="terminal" size="xl" class="keys-ccs__icon" />
	            <span class="keys-usage__now st-num">{{
	              t('keys.ccsClientSelect.claudeCode')
	            }}</span>
	            <span class="keys-ccs__desc">{{
	              t('keys.ccsClientSelect.claudeCodeDesc')
	            }}</span>
	          </button>
	          <button
	            @click="handleCcsClientSelect('gemini')"
	            class="keys-ccs"
	          >
	            <Icon name="sparkles" size="xl" class="keys-ccs__icon" />
	            <span class="keys-usage__now st-num">{{
	              t('keys.ccsClientSelect.geminiCli')
	            }}</span>
	            <span class="keys-ccs__desc">{{
	              t('keys.ccsClientSelect.geminiCliDesc')
	            }}</span>
	          </button>
	        </div>
	      </div>
      <template #footer>
        <div class="keys-form-actions">
          <button @click="closeCcsClientSelect" class="st-btn st-btn--quiet">
            {{ t('common.cancel') }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Group Selector Dropdown (Teleported to body to avoid overflow clipping) -->
    <Teleport to="body">
      <div
        v-if="groupSelectorKeyId !== null && dropdownPosition"
        ref="dropdownRef"
        class="keys-groups"
        style="pointer-events: auto !important;"
        :style="{
          top: dropdownPosition.top !== undefined ? dropdownPosition.top + 'px' : undefined,
          bottom: dropdownPosition.bottom !== undefined ? dropdownPosition.bottom + 'px' : undefined,
          left: dropdownPosition.left + 'px'
        }"
      >
        <!-- Search box -->
        <div class="keys-groups__head">
          <div class="keys-prefixwrap">
            <svg class="keys-groups__searchicon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="groupSearchQuery"
              type="text"
              class="st-input keys-groups__search"
              :placeholder="t('keys.searchGroup')"
              @click.stop
            />
          </div>
        </div>
        <!-- Group list -->
        <div class="keys-groups__list">
          <button
            v-for="option in filteredGroupOptions"
            :key="option.value ?? 'null'"
            @click="changeGroup(selectedKeyForGroup!, option.value)"
            :class="[
              'keys-groups__item',
              
              selectedKeyForGroup?.group_id === option.value ||
              (!selectedKeyForGroup?.group_id && option.value === null)
                ? 'keys-groups__item--on'
                : ''
            ]"
            :title="option.description || undefined"
          >
            <GroupOptionItem
              :name="option.label"
              :platform="option.platform"
              :subscription-type="option.subscriptionType"
              :rate-multiplier="option.rate"
              :user-rate-multiplier="option.userRate"
              :peak-rate-enabled="option.peakRateEnabled"
              :peak-start="option.peakStart"
              :peak-end="option.peakEnd"
              :peak-rate-multiplier="option.peakRateMultiplier"
              :description="option.description"
              :selected="
                selectedKeyForGroup?.group_id === option.value ||
                (!selectedKeyForGroup?.group_id && option.value === null)
              "
            />
          </button>
          <!-- Empty state when search has no results -->
          <div v-if="filteredGroupOptions.length === 0" class="keys-hint keys-groups__empty">
            {{ t('keys.noGroupFound') }}
          </div>
        </div>
      </div>
    </Teleport>
  </UserShell>
</template>


<script setup lang="ts">
	import { ref, reactive, computed, watch, onMounted, onUnmounted, type ComponentPublicInstance } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useAppStore } from '@/stores/app'
	import { useOnboardingStore } from '@/stores/onboarding'
	import { useClipboard } from '@/composables/useClipboard'
import { getPersistedPageSize } from '@/composables/usePersistedPageSize'
import { useUserCoreCopy } from '@/composables/copy/userCore'

const { t } = useI18n()
import { keysAPI, authAPI, usageAPI, userGroupsAPI } from '@/api'
import UserShell from '@/components/shell/UserShell.vue'
import BulkEditKeysModal from '@/components/keys/BulkEditKeysModal.vue'
	import Pagination from '@/components/common/Pagination.vue'
	import BaseDialog from '@/components/common/BaseDialog.vue'
	import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
	import Select from '@/components/common/Select.vue'
	import SearchInput from '@/components/common/SearchInput.vue'
	import Icon from '@/components/icons/Icon.vue'
	import UseKeyModal from '@/components/keys/UseKeyModal.vue'
	import EndpointPopover from '@/components/keys/EndpointPopover.vue'
	import GroupBadge from '@/components/common/GroupBadge.vue'
	import GroupOptionItem from '@/components/common/GroupOptionItem.vue'
	import type { ApiKey, Group, PublicSettings, SubscriptionType, GroupPlatform, UpdateApiKeyRequest } from '@/types'
import type { Column } from '@/components/common/types'
import type { BatchApiKeyUsageStats } from '@/api/usage'
import { formatDateTime } from '@/utils/format'
import { maskApiKey } from '@/utils/maskApiKey'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import { platformBadgeLightClass } from '@/utils/platformColors'
import { KEY_GROUP_PROVIDERS, KEY_GROUP_PROVIDER_ICONS, getKeyGroupProvider, type KeyGroupProvider } from '@/utils/keyGroupProviders'
import {
  CC_SWITCH_USAGE_SCRIPT,
  buildCcSwitchImportDeeplink,
  type CcSwitchClientType
} from '@/utils/ccswitchImport'

// Helper to format date for datetime-local input
const formatDateTimeLocal = (isoDate: string): string => {
  const date = new Date(isoDate)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface GroupOption {
  value: number
  label: string
  description: string | null
  rate: number
  userRate: number | null
  peakRateEnabled: boolean
  peakStart: string
  peakEnd: string
  peakRateMultiplier: number
  subscriptionType: SubscriptionType
  platform: GroupPlatform
}

const appStore = useAppStore()
const onboardingStore = useOnboardingStore()
const { copyToClipboard: clipboardCopy } = useClipboard()

const allColumns = computed<Column[]>(() => [
  { key: 'name', label: t('common.name'), sortable: true },
  { key: 'id', label: t('keys.id'), sortable: true },
  { key: 'key', label: t('keys.apiKey'), sortable: false },
  { key: 'group', label: t('keys.group'), sortable: true },
  { key: 'current_concurrency', label: t('keys.currentConcurrency'), sortable: true },
  { key: 'usage', label: t('keys.usage'), sortable: false },
  { key: 'rate_limit', label: t('keys.rateLimitColumn'), sortable: false },
  { key: 'expires_at', label: t('keys.expiresAt'), sortable: true },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'last_used_at', label: t('keys.lastUsedAt'), sortable: true },
  { key: 'last_used_ip', label: t('keys.lastUsedIP'), sortable: false },
  { key: 'created_at', label: t('keys.created'), sortable: true },
  { key: 'actions', label: t('common.actions'), sortable: false }
])

const ALWAYS_VISIBLE_COLUMNS = new Set(['name', 'actions'])
const DEFAULT_HIDDEN_COLUMNS = ['id', 'rate_limit', 'last_used_at', 'last_used_ip']
const HIDDEN_COLUMNS_KEY = 'api-key-hidden-columns'
const COLUMN_SETTINGS_VERSION_KEY = 'api-key-column-settings-version'
const COLUMN_SETTINGS_VERSION = 3
const VERSION_NEW_HIDDEN_COLUMNS: Record<number, string[]> = {
  2: ['last_used_ip'],
  3: ['id']
}

const toggleableColumns = computed(() =>
  allColumns.value.filter((col) => !ALWAYS_VISIBLE_COLUMNS.has(col.key))
)

const hiddenColumns = reactive<Set<string>>(new Set())

const saveColumnsToStorage = () => {
  try {
    localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify([...hiddenColumns]))
    localStorage.setItem(COLUMN_SETTINGS_VERSION_KEY, String(COLUMN_SETTINGS_VERSION))
  } catch (error) {
    console.error('Failed to save API key table columns:', error)
  }
}

const loadSavedColumns = () => {
  hiddenColumns.clear()
  try {
    const saved = localStorage.getItem(HIDDEN_COLUMNS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as string[]
      const validColumnKeys = new Set(allColumns.value.map((col) => col.key))
      parsed
        .filter((key) =>
          typeof key === 'string' &&
          validColumnKeys.has(key) &&
          !ALWAYS_VISIBLE_COLUMNS.has(key)
        )
        .forEach((key) => hiddenColumns.add(key))
      const storedVersion = Number(localStorage.getItem(COLUMN_SETTINGS_VERSION_KEY) ?? '1')
      if (storedVersion < COLUMN_SETTINGS_VERSION) {
        for (let v = storedVersion + 1; v <= COLUMN_SETTINGS_VERSION; v++) {
          for (const key of VERSION_NEW_HIDDEN_COLUMNS[v] ?? []) {
            if (validColumnKeys.has(key) && !ALWAYS_VISIBLE_COLUMNS.has(key)) {
              hiddenColumns.add(key)
            }
          }
        }
        saveColumnsToStorage()
      } else {
        localStorage.setItem(COLUMN_SETTINGS_VERSION_KEY, String(COLUMN_SETTINGS_VERSION))
      }
    } else {
      DEFAULT_HIDDEN_COLUMNS.forEach((key) => hiddenColumns.add(key))
      localStorage.setItem(COLUMN_SETTINGS_VERSION_KEY, String(COLUMN_SETTINGS_VERSION))
    }
  } catch (error) {
    console.error('Failed to load API key table columns:', error)
    DEFAULT_HIDDEN_COLUMNS.forEach((key) => hiddenColumns.add(key))
  }
}

const toggleColumn = (key: string) => {
  if (ALWAYS_VISIBLE_COLUMNS.has(key)) return
  if (hiddenColumns.has(key)) {
    hiddenColumns.delete(key)
  } else {
    hiddenColumns.add(key)
  }
  saveColumnsToStorage()
}

const isColumnVisible = (key: string) => !hiddenColumns.has(key)

const columns = computed<Column[]>(() =>
  allColumns.value.filter((col) => ALWAYS_VISIBLE_COLUMNS.has(col.key) || !hiddenColumns.has(col.key))
)

const apiKeys = ref<ApiKey[]>([])
const selectedIds = ref<number[]>([])
const showBulkEditModal = ref(false)
const selectedApiKeys = computed(() => apiKeys.value.filter((key) => selectedIds.value.includes(key.id)))

const handleSelectionChange = (ids: Array<string | number>) => {
  const visibleIds = new Set(apiKeys.value.map((key) => key.id))
  selectedIds.value = [...new Set(ids.map(Number))].filter((id) => visibleIds.has(id))
}

const handleBulkUpdated = (succeededIds: number[]) => {
  const succeeded = new Set(succeededIds)
  selectedIds.value = selectedIds.value.filter((id) => !succeeded.has(id))
  loadApiKeys()
}

const groups = ref<Group[]>([])
const loading = ref(false)
const submitting = ref(false)
const now = ref(new Date())
let resetTimer: ReturnType<typeof setInterval> | null = null
const usageStats = ref<Record<string, BatchApiKeyUsageStats>>({})
const usageLoading = ref(false)
const userGroupRates = ref<Record<number, number>>({})

const pagination = ref({
  page: 1,
  page_size: getPersistedPageSize(),
  total: 0,
  pages: 0
})
const sortState = ref({
  sort_by: 'created_at',
  sort_order: 'desc' as 'asc' | 'desc'
})

// Filter state
const filterSearch = ref('')
const filterStatus = ref('')
const filterGroupId = ref<string | number>('')

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteDialog = ref(false)
const showResetQuotaDialog = ref(false)
const showResetRateLimitDialog = ref(false)
const showUseKeyModal = ref(false)
const showCcsClientSelect = ref(false)
const showColumnDropdown = ref(false)
const pendingCcsRow = ref<ApiKey | null>(null)
const selectedKey = ref<ApiKey | null>(null)
const copiedKeyId = ref<number | null>(null)
const groupSelectorKeyId = ref<number | null>(null)
const publicSettings = ref<PublicSettings | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const columnDropdownRef = ref<HTMLElement | null>(null)
const dropdownPosition = ref<{ top?: number; bottom?: number; left: number } | null>(null)
const groupButtonRefs = ref<Map<number, HTMLElement>>(new Map())
let abortController: AbortController | null = null

// Get the currently selected key for group change
const selectedKeyForGroup = computed(() => {
  if (groupSelectorKeyId.value === null) return null
  return apiKeys.value.find((k) => k.id === groupSelectorKeyId.value) || null
})

const setGroupButtonRef = (keyId: number, el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement) {
    groupButtonRefs.value.set(keyId, el)
  } else {
    groupButtonRefs.value.delete(keyId)
  }
}

const formData = ref({
  name: '',
  group_id: null as number | null,
  status: 'active' as 'active' | 'inactive',
  use_custom_key: false,
  custom_key: '',
  enable_ip_restriction: false,
  ip_whitelist: '',
  ip_blacklist: '',
  // Quota settings (empty = unlimited)
  enable_quota: false,
  quota: null as number | null,
  // Rate limit settings
  enable_rate_limit: false,
  rate_limit_5h: null as number | null,
  rate_limit_1d: null as number | null,
  rate_limit_7d: null as number | null,
  enable_expiration: false,
  expiration_preset: '30' as '7' | '30' | '90' | 'custom',
  expiration_date: ''
})

// 自定义Key验证
const customKeyError = computed(() => {
  if (!formData.value.use_custom_key || !formData.value.custom_key) {
    return ''
  }
  const key = formData.value.custom_key
  if (key.length < 16) {
    return t('keys.customKeyTooShort')
  }
  // 检查字符：只允许字母、数字、下划线、连字符
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
    return t('keys.customKeyInvalidChars')
  }
  return ''
})

const statusOptions = computed(() => [
  { value: 'active', label: t('common.active') },
  { value: 'inactive', label: t('common.inactive') }
])

const shouldSubmitEditStatus = (key: ApiKey, status: 'active' | 'inactive') => {
  if (key.status === 'quota_exhausted' || key.status === 'expired') {
    return status === 'active'
  }
  return true
}

// Filter dropdown options
const groupFilterOptions = computed(() => [
  { value: '', label: t('keys.allGroups') },
  { value: 0, label: t('keys.noGroup') },
  ...groups.value.map((g) => ({ value: g.id, label: g.name }))
])

const statusFilterOptions = computed(() => [
  { value: '', label: t('keys.allStatus') },
  { value: 'active', label: t('keys.status.active') },
  { value: 'inactive', label: t('keys.status.inactive') },
  { value: 'quota_exhausted', label: t('keys.status.quota_exhausted') },
  { value: 'expired', label: t('keys.status.expired') }
])

const onFilterChange = () => {
  selectedIds.value = []
  pagination.value.page = 1
  loadApiKeys()
}

const onGroupFilterChange = (value: string | number | boolean | null) => {
  filterGroupId.value = value as string | number
  onFilterChange()
}

const onStatusFilterChange = (value: string | number | boolean | null) => {
  filterStatus.value = value as string
  onFilterChange()
}

// Convert groups to Select options format with rate multiplier and subscription type
const groupOptions = computed(() =>
  groups.value.map((group) => ({
    value: group.id,
    label: group.name,
    description: group.description,
    rate: group.rate_multiplier,
    userRate: userGroupRates.value[group.id] ?? null,
    peakRateEnabled: group.peak_rate_enabled,
    peakStart: group.peak_start,
    peakEnd: group.peak_end,
    peakRateMultiplier: group.peak_rate_multiplier,
    subscriptionType: group.subscription_type,
    platform: group.platform
  }))
)

const createProvider = ref<KeyGroupProvider>('anthropic')
const createProviderOptions = computed(() => KEY_GROUP_PROVIDERS.map((value) => ({
  value,
  label: t(`keys.providers.${value}`),
  count: groups.value.filter((group) => getKeyGroupProvider(group.platform) === value).length
})))

const formGroupOptions = computed(() => showEditModal.value
  ? groupOptions.value
  : groupOptions.value.filter((group) => getKeyGroupProvider(group.platform) === createProvider.value)
)

const selectCreateProvider = (provider: KeyGroupProvider) => {
  if (createProvider.value === provider) return
  createProvider.value = provider
  formData.value.group_id = null
}

// Also handles groups arriving after the create dialog has already opened.
watch([showCreateModal, createProviderOptions], ([isOpen, providers], [wasOpen]) => {
  if (!isOpen) return
  if (!wasOpen || !providers.some((provider) => provider.value === createProvider.value && provider.count > 0)) {
    selectCreateProvider(providers.find((provider) => provider.count > 0)?.value ?? 'anthropic')
  }
  if (!formGroupOptions.value.some((group) => group.value === formData.value.group_id)) {
    formData.value.group_id = null
  }
})

// Group dropdown search
const groupSearchQuery = ref('')
const filteredGroupOptions = computed(() => {
  const query = groupSearchQuery.value.trim().toLowerCase()
  if (!query) return groupOptions.value
  return groupOptions.value.filter((opt) => {
    return opt.label.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query))
  })
})

const copyToClipboard = async (text: string, keyId: number) => {
  const success = await clipboardCopy(text, t('keys.copied'))
  if (success) {
    copiedKeyId.value = keyId
    setTimeout(() => {
      copiedKeyId.value = null
    }, 800)
  }
}

const isAbortError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const { name, code } = error as { name?: string; code?: string }
  return name === 'AbortError' || code === 'ERR_CANCELED'
}

const loadApiKeys = async () => {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller
  const { signal } = controller
  loading.value = true
  usageLoading.value = false
  try {
    // Build filters
    const filters: {
      search?: string
      status?: string
      group_id?: number | string
      sort_by?: string
      sort_order?: 'asc' | 'desc'
    } = {}
    if (filterSearch.value) filters.search = filterSearch.value
    if (filterStatus.value) filters.status = filterStatus.value
    if (filterGroupId.value !== '') filters.group_id = filterGroupId.value
    filters.sort_by = sortState.value.sort_by
    filters.sort_order = sortState.value.sort_order

    const response = await keysAPI.list(pagination.value.page, pagination.value.page_size, filters, {
      signal
    })
    if (signal.aborted) return
    apiKeys.value = response.items
    handleSelectionChange(selectedIds.value)
    pagination.value.total = response.total
    pagination.value.pages = response.pages

    // 用量统计要聚合 30 天的 usage_logs，可能比列表慢很多：不阻塞表格渲染，单独加载
    usageLoading.value = response.items.length > 0
    if (response.items.length > 0) {
      void loadUsageStats(response.items.map((k) => k.id), signal)
    }
  } catch (error) {
    if (isAbortError(error)) {
      return
    }
    appStore.showError(t('keys.failedToLoad'))
  } finally {
    if (abortController === controller) {
      loading.value = false
    }
  }
}

const loadUsageStats = async (keyIds: number[], signal: AbortSignal) => {
  try {
    const usageResponse = await usageAPI.getDashboardApiKeysUsage(keyIds, { signal })
    if (signal.aborted) return
    usageStats.value = usageResponse.stats
  } catch (e) {
    if (!isAbortError(e)) {
      console.error('Failed to load usage stats:', e)
    }
  } finally {
    if (!signal.aborted) {
      usageLoading.value = false
    }
  }
}

const loadGroups = async () => {
  try {
    groups.value = await userGroupsAPI.getAvailable()
  } catch (error) {
    console.error('Failed to load groups:', error)
  }
}

const loadUserGroupRates = async () => {
  try {
    userGroupRates.value = await userGroupsAPI.getUserGroupRates()
  } catch (error) {
    console.error('Failed to load user group rates:', error)
  }
}

const loadPublicSettings = async () => {
  try {
    publicSettings.value = await authAPI.getPublicSettings()
  } catch (error) {
    console.error('Failed to load public settings:', error)
  }
}

const openUseKeyModal = (key: ApiKey) => {
  selectedKey.value = key
  showUseKeyModal.value = true
}

const closeUseKeyModal = () => {
  showUseKeyModal.value = false
  selectedKey.value = null
}

const handlePageChange = (page: number) => {
  selectedIds.value = []
  pagination.value.page = page
  loadApiKeys()
}

const handlePageSizeChange = (pageSize: number) => {
  selectedIds.value = []
  pagination.value.page_size = pageSize
  pagination.value.page = 1
  loadApiKeys()
}

const handleSort = (key: string, order: 'asc' | 'desc') => {
  selectedIds.value = []
  sortState.value.sort_by = key
  sortState.value.sort_order = order
  pagination.value.page = 1
  loadApiKeys()
}

const editKey = (key: ApiKey) => {
  selectedKey.value = key
  const hasIPRestriction = (key.ip_whitelist?.length > 0) || (key.ip_blacklist?.length > 0)
  const hasExpiration = !!key.expires_at
  formData.value = {
    name: key.name,
    group_id: key.group_id,
    status: key.status === 'quota_exhausted' || key.status === 'expired' ? 'inactive' : key.status,
    use_custom_key: false,
    custom_key: '',
    enable_ip_restriction: hasIPRestriction,
    ip_whitelist: (key.ip_whitelist || []).join('\n'),
    ip_blacklist: (key.ip_blacklist || []).join('\n'),
    enable_quota: key.quota > 0,
    quota: key.quota > 0 ? key.quota : null,
    enable_rate_limit: (key.rate_limit_5h > 0) || (key.rate_limit_1d > 0) || (key.rate_limit_7d > 0),
    rate_limit_5h: key.rate_limit_5h || null,
    rate_limit_1d: key.rate_limit_1d || null,
    rate_limit_7d: key.rate_limit_7d || null,
    enable_expiration: hasExpiration,
    expiration_preset: 'custom',
    expiration_date: key.expires_at ? formatDateTimeLocal(key.expires_at) : ''
  }
  showEditModal.value = true
}

const toggleKeyStatus = async (key: ApiKey) => {
  const newStatus = key.status === 'active' ? 'inactive' : 'active'
  try {
    await keysAPI.toggleStatus(key.id, newStatus)
    appStore.showSuccess(
      newStatus === 'active' ? t('keys.keyEnabledSuccess') : t('keys.keyDisabledSuccess')
    )
    loadApiKeys()
  } catch (error) {
    appStore.showError(t('keys.failedToUpdateStatus'))
  }
}

const openGroupSelector = (key: ApiKey) => {
  if (groupSelectorKeyId.value === key.id) {
    groupSelectorKeyId.value = null
    dropdownPosition.value = null
  } else {
    const buttonEl = groupButtonRefs.value.get(key.id)
    if (buttonEl) {
      const rect = buttonEl.getBoundingClientRect()
      const dropdownEstHeight = 400 // estimated max dropdown height
      const dropdownEstWidth = Math.min(380, window.innerWidth - 16)
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      // 夹取 left，避免窄屏下浮层超出视口右缘
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - dropdownEstWidth - 8))

      if (spaceBelow < dropdownEstHeight && spaceAbove > spaceBelow) {
        // Not enough space below, pop upward
        dropdownPosition.value = {
          bottom: window.innerHeight - rect.top + 4,
          left
        }
      } else {
        // Default: pop downward
        dropdownPosition.value = {
          top: rect.bottom + 4,
          left
        }
      }
    }
    groupSelectorKeyId.value = key.id
    groupSearchQuery.value = ''
  }
}

const changeGroup = async (key: ApiKey, newGroupId: number | null) => {
  groupSelectorKeyId.value = null
  dropdownPosition.value = null
  if (key.group_id === newGroupId) return

  try {
    await keysAPI.update(key.id, { group_id: newGroupId })
    appStore.showSuccess(t('keys.groupChangedSuccess'))
    loadApiKeys()
  } catch (error) {
    appStore.showError(t('keys.failedToChangeGroup'))
  }
}

const closeGroupSelector = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  // Check if click is inside the dropdown or the trigger button
  if (!target.closest('.group\\/dropdown') && !dropdownRef.value?.contains(target)) {
    groupSelectorKeyId.value = null
    dropdownPosition.value = null
  }
  if (columnDropdownRef.value && !columnDropdownRef.value.contains(target)) {
    showColumnDropdown.value = false
  }
}

const confirmDelete = (key: ApiKey) => {
  selectedKey.value = key
  showDeleteDialog.value = true
}

const handleSubmit = async () => {
  // Validate group_id is required
  if (formData.value.group_id === null) {
    appStore.showError(t('keys.groupRequired'))
    return
  }

  // Validate custom key if enabled
  if (!showEditModal.value && formData.value.use_custom_key) {
    if (!formData.value.custom_key) {
      appStore.showError(t('keys.customKeyRequired'))
      return
    }
    if (customKeyError.value) {
      appStore.showError(customKeyError.value)
      return
    }
  }

  // Parse IP lists only if IP restriction is enabled
  const parseIPList = (text: string): string[] =>
    text.split('\n').map(ip => ip.trim()).filter(ip => ip.length > 0)
  const ipWhitelist = formData.value.enable_ip_restriction ? parseIPList(formData.value.ip_whitelist) : []
  const ipBlacklist = formData.value.enable_ip_restriction ? parseIPList(formData.value.ip_blacklist) : []

  // Calculate quota value (null/empty/0 = unlimited, stored as 0)
  const quota = formData.value.quota && formData.value.quota > 0 ? formData.value.quota : 0

  // Calculate expiration
  let expiresInDays: number | undefined
  let expiresAt: string | null | undefined
  if (formData.value.enable_expiration && formData.value.expiration_date) {
    if (!showEditModal.value) {
      // Create mode: calculate days from date
      const expDate = new Date(formData.value.expiration_date)
      const now = new Date()
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      expiresInDays = diffDays > 0 ? diffDays : 1
    } else {
      // Edit mode: use custom date directly
      expiresAt = new Date(formData.value.expiration_date).toISOString()
    }
  } else if (showEditModal.value) {
    // Edit mode: if expiration disabled or date cleared, send empty string to clear
    expiresAt = ''
  }

  // Calculate rate limit values (send 0 when toggle is off)
  const rateLimitData = formData.value.enable_rate_limit ? {
    rate_limit_5h: formData.value.rate_limit_5h && formData.value.rate_limit_5h > 0 ? formData.value.rate_limit_5h : 0,
    rate_limit_1d: formData.value.rate_limit_1d && formData.value.rate_limit_1d > 0 ? formData.value.rate_limit_1d : 0,
    rate_limit_7d: formData.value.rate_limit_7d && formData.value.rate_limit_7d > 0 ? formData.value.rate_limit_7d : 0,
  } : { rate_limit_5h: 0, rate_limit_1d: 0, rate_limit_7d: 0 }

  submitting.value = true
  try {
    if (showEditModal.value && selectedKey.value) {
      const updates: UpdateApiKeyRequest = {
        name: formData.value.name,
        group_id: formData.value.group_id,
        ip_whitelist: ipWhitelist,
        ip_blacklist: ipBlacklist,
        quota: quota,
        expires_at: expiresAt,
        rate_limit_5h: rateLimitData.rate_limit_5h,
        rate_limit_1d: rateLimitData.rate_limit_1d,
        rate_limit_7d: rateLimitData.rate_limit_7d,
      }
      if (shouldSubmitEditStatus(selectedKey.value, formData.value.status)) {
        updates.status = formData.value.status
      }
      await keysAPI.update(selectedKey.value.id, updates)
      appStore.showSuccess(t('keys.keyUpdatedSuccess'))
    } else {
      const customKey = formData.value.use_custom_key ? formData.value.custom_key : undefined
      await keysAPI.create(
        formData.value.name,
        formData.value.group_id,
        customKey,
        ipWhitelist,
        ipBlacklist,
        quota,
        expiresInDays,
        rateLimitData
      )
      appStore.showSuccess(t('keys.keyCreatedSuccess'))
      // Only advance tour if active, on submit step, and creation succeeded
      if (onboardingStore.isCurrentStep('[data-tour="key-form-submit"]')) {
        onboardingStore.nextStep(500)
      }
    }
    closeModals()
    loadApiKeys()
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || t('keys.failedToSave')
    appStore.showError(errorMsg)
    // Don't advance tour on error
  } finally {
    submitting.value = false
  }
}

/**
 * 处理删除 API Key 的操作
 * 优化：错误处理改进，优先显示后端返回的具体错误消息（如权限不足等），
 * 若后端未返回消息则显示默认的国际化文本
 */
const handleDelete = async () => {
  if (!selectedKey.value) return

  try {
    await keysAPI.delete(selectedKey.value.id)
    appStore.showSuccess(t('keys.keyDeletedSuccess'))
    showDeleteDialog.value = false
    loadApiKeys()
  } catch (error: any) {
    // 优先使用后端返回的错误消息，提供更具体的错误信息给用户
    const errorMsg = error?.message || t('keys.failedToDelete')
    appStore.showError(errorMsg)
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedKey.value = null
  formData.value = {
    name: '',
    group_id: null,
    status: 'active',
    use_custom_key: false,
    custom_key: '',
    enable_ip_restriction: false,
    ip_whitelist: '',
    ip_blacklist: '',
    enable_quota: false,
    quota: null,
    enable_rate_limit: false,
    rate_limit_5h: null,
    rate_limit_1d: null,
    rate_limit_7d: null,
    enable_expiration: false,
    expiration_preset: '30',
    expiration_date: ''
  }
}

// Show reset quota confirmation dialog
const confirmResetQuota = () => {
  showResetQuotaDialog.value = true
}

// Set expiration date based on quick select days
const setExpirationDays = (days: number) => {
  formData.value.expiration_preset = days.toString() as '7' | '30' | '90'
  const expDate = new Date()
  expDate.setDate(expDate.getDate() + days)
  formData.value.expiration_date = formatDateTimeLocal(expDate.toISOString())
}

// Reset quota used for an API key
const resetQuotaUsed = async () => {
  const key = selectedKey.value
  if (!key) return
  showResetQuotaDialog.value = false
  try {
    const updatedKey = await keysAPI.update(key.id, { reset_quota: true })
    appStore.showSuccess(t('keys.quotaResetSuccess'))
    key.quota_used = updatedKey.quota_used
    if (key.status !== updatedKey.status) {
      key.status = updatedKey.status
      if (selectedKey.value?.id === key.id) {
        formData.value.status = updatedKey.status === 'active' ? 'active' : 'inactive'
      }
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || t('keys.failedToResetQuota')
    appStore.showError(errorMsg)
  }
}

// Show reset rate limit confirmation dialog (from edit modal)
const confirmResetRateLimit = () => {
  showResetRateLimitDialog.value = true
}

// Show reset rate limit confirmation dialog (from table row)
const confirmResetRateLimitFromTable = (row: ApiKey) => {
  selectedKey.value = row
  showResetRateLimitDialog.value = true
}

// Reset rate limit usage for an API key
const resetRateLimitUsage = async () => {
  if (!selectedKey.value) return
  showResetRateLimitDialog.value = false
  try {
    await keysAPI.update(selectedKey.value.id, { reset_rate_limit_usage: true })
    appStore.showSuccess(t('keys.rateLimitResetSuccess'))
    // Refresh key data
    await loadApiKeys()
    // Update the editing key with fresh data
    const refreshedKey = apiKeys.value.find(k => k.id === selectedKey.value!.id)
    if (refreshedKey) {
      selectedKey.value = refreshedKey
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || t('keys.failedToResetRateLimit')
    appStore.showError(errorMsg)
  }
}

const importToCcswitch = (row: ApiKey) => {
  const platform = row.group?.platform || 'anthropic'

  // For antigravity platform, show client selection dialog
  if (platform === 'antigravity') {
    pendingCcsRow.value = row
    showCcsClientSelect.value = true
    return
  }

  // For other platforms, execute directly
  executeCcsImport(row, platform === 'gemini' ? 'gemini' : 'claude')
}

const executeCcsImport = (row: ApiKey, clientType: CcSwitchClientType) => {
  const baseUrl = publicSettings.value?.api_base_url || window.location.origin
  const platform = row.group?.platform || 'anthropic'

  const usageScript = CC_SWITCH_USAGE_SCRIPT
  const providerName = (publicSettings.value?.site_name || 'sub2api').trim() || 'sub2api'
  const deeplink = buildCcSwitchImportDeeplink({
    baseUrl,
    platform,
    clientType,
    providerName,
    apiKey: row.key,
    usageScript
  })

  try {
    window.open(deeplink, '_self')

    // Check if the protocol handler worked by detecting if we're still focused
    setTimeout(() => {
      if (document.hasFocus()) {
        // Still focused means the protocol handler likely failed
        appStore.showError(t('keys.ccSwitchNotInstalled'))
      }
    }, 100)
  } catch (error) {
    appStore.showError(t('keys.ccSwitchNotInstalled'))
  }
}

const handleCcsClientSelect = (clientType: CcSwitchClientType) => {
  if (pendingCcsRow.value) {
    executeCcsImport(pendingCcsRow.value, clientType)
  }
  showCcsClientSelect.value = false
  pendingCcsRow.value = null
}

const closeCcsClientSelect = () => {
  showCcsClientSelect.value = false
  pendingCcsRow.value = null
}

function formatResetTime(resetAt: string | null): string {
  if (!resetAt) return ''
  const diff = new Date(resetAt).getTime() - now.value.getTime()
  if (diff <= 0) return t('keys.resetNow')
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

const { c } = useUserCoreCopy()

onMounted(() => {
  loadSavedColumns()
  loadApiKeys()
  loadGroups()
  loadUserGroupRates()
  loadPublicSettings()
  document.addEventListener('click', closeGroupSelector)
  resetTimer = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => {
  document.removeEventListener('click', closeGroupSelector)
  if (resetTimer) clearInterval(resetTimer)
})
</script>
<style scoped>
.keys { padding-bottom: clamp(48px, 6vw, 84px); }
.keys__inner { display: flex; flex-direction: column; gap: clamp(18px, 2.4vw, 28px); min-width: 0; }

.keys__head { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.keys__head-copy { display: flex; flex-direction: column; gap: 10px; max-width: 64ch; min-width: 0; }
.keys__title { margin-top: 2px; overflow-wrap: anywhere; }
.keys__lede { font-size: clamp(0.95rem, 1.2vw, 1.05rem); }
.keys__head-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.keys__toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.keys__search { width: 100%; max-width: 280px; min-width: 0; }
.keys__filter { width: 150px; max-width: 100%; }
.keys__sortseg { flex-wrap: wrap; }
.keys__toolbar-end { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-left: auto; }
.keys__cols { position: relative; }
.keys__cols-menu {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 60;
  min-width: 210px; max-width: calc(100vw - 24px); padding: 8px;
  border-radius: var(--st-r-md); border: 1px solid var(--st-line);
  background: var(--st-bg); box-shadow: var(--st-shadow-2);
}
.keys__cols-title { margin: 0 0 4px; padding: 4px 8px 8px; font-size: 0.72rem; letter-spacing: 0.06em; color: var(--st-ink-3); border-bottom: 1px solid var(--st-line); }
.keys__cols-item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; padding: 8px; border: 0; border-radius: 9px; background: none;
  font-family: inherit; font-size: 0.84rem; color: var(--st-ink-2); text-align: left; cursor: pointer;
  transition: background-color var(--st-t-fast) var(--st-ease), color var(--st-t-fast) var(--st-ease);
}
.keys__cols-item:hover { background: var(--st-brand-soft); color: var(--st-ink); }
.keys__cols-check { color: var(--st-brand-text); }
.keys__spin { animation: keys-spin 900ms linear infinite; }
@keyframes keys-spin { to { transform: rotate(360deg); } }

.keys__bulk {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 14px; border-radius: var(--st-r-md);
  border: 1px solid var(--st-brand-line); background: var(--st-brand-soft);
}
.keys__bulk-count { font-size: 0.84rem; font-weight: 550; color: var(--st-ink); }

.keys__grid { display: grid; grid-template-columns: 1fr; gap: 14px; min-width: 0; }
.keys__card { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.keys__card-head { display: flex; align-items: center; gap: 10px; min-width: 0; }
.keys__select { display: inline-flex; align-items: center; flex: none; }
.keys__select input { width: 15px; height: 15px; accent-color: var(--st-brand); cursor: pointer; }
.keys__name { font-size: 1rem; font-weight: 600; letter-spacing: -0.01em; color: var(--st-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.keys__shield { flex: none; color: var(--st-brand-text); }
.keys__id { font-size: 0.72rem; color: var(--st-ink-3); }
.keys__status { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; flex: none; font-size: 0.74rem; font-weight: 550; color: var(--st-ink-2); }
.keys__status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--st-ink-3); }
.keys__status--active { color: var(--st-brand-text); }
.keys__status--active .keys__status-dot { background: var(--st-brand); box-shadow: 0 0 0 3px var(--st-brand-soft); }
.keys__status--quota_exhausted { color: var(--st-warn); }
.keys__status--quota_exhausted .keys__status-dot { background: var(--st-warn); }
.keys__status--expired, .keys__status--inactive { color: var(--st-danger); }
.keys__status--expired .keys__status-dot, .keys__status--inactive .keys__status-dot { background: var(--st-danger); }

.keys__key {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; min-width: 0; padding: 8px 10px; border-radius: var(--st-r-md);
  border: 1px solid var(--st-line); background: var(--st-bg-sink); cursor: pointer;
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.keys__key:hover { border-color: var(--st-brand-line); background: color-mix(in srgb, var(--st-brand) 6%, var(--st-bg-sink)); }
.keys__key-code { min-width: 0; background: transparent; border: 0; padding: 0; font-size: 0.78rem; color: var(--st-ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.keys__copy { display: inline-flex; align-items: center; gap: 5px; flex: none; font-size: 0.72rem; color: var(--st-ink-3); }
.keys__copy--done { color: var(--st-brand-text); }
.keys__copy-label { white-space: nowrap; }

.keys__facts { display: flex; flex-direction: column; gap: 7px; margin: 0; }
.keys__fact { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; min-width: 0; }
.keys__fact dt { font-size: 0.74rem; color: var(--st-ink-3); flex: none; }
.keys__fact dd { margin: 0; font-size: 0.84rem; color: var(--st-ink); display: inline-flex; align-items: baseline; gap: 4px; min-width: 0; overflow-wrap: anywhere; }
.keys__fact-sub { font-size: 0.72rem; color: var(--st-ink-3); }
.keys__fact-muted { color: var(--st-ink-2) !important; font-size: 0.8rem !important; }
.keys__fact-danger { color: var(--st-danger) !important; }
.keys__fact-warn { color: var(--st-warn) !important; }
.keys__pending { display: inline-block; width: 56px; height: 11px; }

.keys__quota, .keys__ratelimit { display: flex; flex-direction: column; gap: 6px; padding-top: 10px; border-top: 1px solid var(--st-line); }
.keys__quota-line { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; font-size: 0.76rem; color: var(--st-ink-2); }
.keys__rl-reset { font-size: 0.7rem; color: var(--st-ink-3); }
.keys__bar { height: 4px; border-radius: 999px; background: var(--st-bg-sink); overflow: hidden; }
.keys__bar-fill { display: block; height: 100%; border-radius: 999px; background: var(--st-brand); transition: width var(--st-t) var(--st-ease); }
.keys__bar-fill--ok { background: var(--st-brand); }
.keys__bar-fill--warn { background: var(--st-warn); }
.keys__bar-fill--off { background: var(--st-danger); }
.keys__textbtn { align-self: flex-start; margin-top: 2px; padding: 2px 6px; border: 0; border-radius: 8px; background: none; font-family: inherit; font-size: 0.72rem; color: var(--st-ink-3); cursor: pointer; }
.keys__textbtn:hover { background: var(--st-brand-soft); color: var(--st-brand-text); }

.keys__card-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--st-line); }
.keys__group-btn {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0;
  padding: 4px 8px; margin-left: -8px;
  border: 0; border-radius: 9px; background: none; cursor: pointer; color: var(--st-ink-2);
  transition: background-color var(--st-t-fast) var(--st-ease);
}
.keys__group-btn:hover { background: var(--st-brand-soft); }
.keys__group-empty { font-size: 0.78rem; color: var(--st-ink-3); }
.keys__group-caret { color: var(--st-ink-3); flex: none; }
.keys__actions { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; flex: none; }
.keys__action {
  display: inline-grid; place-items: center; width: 32px; height: 32px;
  border: 0; border-radius: 10px; background: transparent; color: var(--st-ink-3); cursor: pointer;
  transition: background-color var(--st-t-fast) var(--st-ease), color var(--st-t-fast) var(--st-ease), transform var(--st-t-fast) var(--st-ease);
}
.keys__action:hover { background: var(--st-brand-soft); color: var(--st-ink); transform: translateY(-1px); }
.keys__action--danger:hover { background: var(--st-danger-soft); color: var(--st-danger); }

.keys__skeleton { display: flex; flex-direction: column; gap: 12px; min-height: 200px; }
.keys__sk-line { display: block; height: 12px; }
.keys__sk-line--lg { height: 18px; width: 56%; }
.keys__sk-line--sm { width: 40%; }

.keys__empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: clamp(32px, 6vw, 64px) 20px; text-align: center;
  border-radius: var(--st-r-xl); border: 1px dashed var(--st-line-2);
  background: radial-gradient(ellipse 60% 70% at 50% 0%, color-mix(in srgb, var(--st-brand) 7%, transparent), transparent 72%);
}
.keys__empty-art { margin-bottom: 4px; max-width: 100%; height: auto; }
.keys__empty-title { margin-top: 4px; }
.keys__empty-body { font-size: 0.9rem; max-width: 44ch; }

.keys__pager { display: flex; justify-content: center; flex-wrap: wrap; padding-top: 8px; }

/* 弹窗内表单 */
.keys-stack { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.keys-stack--tight { gap: 9px; }
.keys-stack--loose { gap: 20px; }
.keys-switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.keys-switch {
  position: relative; display: inline-flex; align-items: center; flex: none;
  width: 40px; height: 23px; padding: 2px; border-radius: 999px;
  border: 1px solid var(--st-line-2); background: var(--st-bg-sink); cursor: pointer;
  transition: background-color var(--st-t) var(--st-ease), border-color var(--st-t) var(--st-ease);
}
.keys-switch--on { background: var(--st-brand); border-color: var(--st-brand); }
.keys-switch__knob { display: block; width: 17px; height: 17px; border-radius: 50%; background: var(--st-bg); border: 1px solid var(--st-line-2); transition: transform var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease); }
.keys-switch--on .keys-switch__knob { transform: translateX(17px); background: var(--st-brand-ink); border-color: transparent; }
.keys-switch:focus-visible { outline: 2px solid var(--st-brand); outline-offset: 2px; }
.keys-providers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.keys-provider {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 10px 6px; border-radius: var(--st-r-md); text-align: center; cursor: pointer;
  border: 1px solid var(--st-line); background: var(--st-bg); min-width: 0;
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.keys-provider:hover { border-color: var(--st-line-2); }
.keys-provider--on { border-color: var(--st-brand); background: var(--st-brand-soft); }
.keys-provider--off { opacity: 0.45; cursor: not-allowed; }
.keys-provider__input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.keys-provider__icons { display: flex; align-items: center; justify-content: center; gap: 6px; }
.keys-provider__ico { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px; }
.keys-provider__label { font-size: 0.8rem; font-weight: 550; color: var(--st-ink); overflow-wrap: anywhere; }
.keys-usage__row { display: flex; align-items: baseline; gap: 6px; min-width: 0; flex-wrap: wrap; }
.keys__usage-box { display: flex; align-items: baseline; gap: 6px; min-width: 0; padding: 8px 12px; border-radius: var(--st-r-md); background: var(--st-bg-soft); border: 1px solid var(--st-line); font-size: 0.84rem; color: var(--st-ink); }
.keys-usage__now { color: var(--st-ink); }
.keys-usage__now--warn { color: var(--st-warn); }
.keys-usage__now--danger { color: var(--st-danger); }
.keys-usage__sep { color: var(--st-ink-3); }
.keys-usage__max { color: var(--st-ink-3); }
.keys-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.keys-chip {
  height: 32px; padding-inline: 13px; border-radius: 999px;
  border: 1px solid var(--st-line); background: var(--st-bg);
  font-family: inherit; font-size: 0.8rem; color: var(--st-ink-2); cursor: pointer;
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease);
}
.keys-chip:hover { border-color: var(--st-line-2); color: var(--st-ink); }
.keys-chip--on { background: var(--st-brand-soft); border-color: var(--st-brand-line); color: var(--st-brand-text); }
.keys-prefixwrap { position: relative; min-width: 0; }
.keys-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--st-ink-3); pointer-events: none; }
.keys__pl { padding-left: 30px; }
.keys__mono { font-family: var(--st-font-mono); }
.keys__hint { margin-top: 6px; font-size: 0.74rem; line-height: 1.6; color: var(--st-ink-3); }
.keys-hint { margin-top: 6px; font-size: 0.74rem; line-height: 1.6; color: var(--st-ink-3); }
.keys-hint--danger { color: var(--st-danger); }
.keys__label-inline { margin-bottom: 0; }
.keys-note { display: flex; flex-wrap: wrap; gap: 4px; font-size: 0.8rem; }
.keys-note__label { color: var(--st-ink-3); }
.keys-note__value { color: var(--st-ink); font-weight: 500; }
.keys-form-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }
.keys-pager-note { color: var(--st-ink-3); }

/* 分组浮层 */
.keys-groups {
  position: fixed; z-index: 100000020;
  width: max-content; max-width: calc(100vw - 16px);
  overflow: hidden; border-radius: var(--st-r-md);
  border: 1px solid var(--st-line); background: var(--st-bg);
  box-shadow: var(--st-shadow-3);
}
.keys-groups__head { border-bottom: 1px solid var(--st-line); padding: 8px; }
.keys-groups__searchwrap { position: relative; }
.keys-groups__searchicon { position: absolute; left: 10px; top: 50%; width: 16px; height: 16px; transform: translateY(-50%); color: var(--st-ink-3); }
.keys-groups__search { padding-left: 32px; font-size: 0.84rem; }
.keys-groups__list { max-height: 300px; overflow-y: auto; padding: 6px; }
.keys-groups__item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 9px 10px; border: 0; border-radius: 9px; background: none;
  font-family: inherit; font-size: 0.84rem; color: var(--st-ink-2); text-align: left; cursor: pointer;
  transition: background-color var(--st-t-fast) var(--st-ease);
}
.keys-groups__item + .keys-groups__item { border-top: 1px solid var(--st-line); }
.keys-groups__item:hover { background: var(--st-bg-soft); }
.keys-groups__item--on { background: var(--st-brand-soft); color: var(--st-ink); }
.keys-groups__empty { padding: 16px 8px; text-align: center; }

/* CCS 客户端选择 */
.keys-ccs-wrap { display: flex; flex-direction: column; gap: 14px; }
.keys-ccs-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.keys-ccs {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px; border-radius: var(--st-r-md); cursor: pointer;
  border: 1px solid var(--st-line); background: var(--st-bg);
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.keys-ccs:hover { border-color: var(--st-brand-line); background: var(--st-bg-soft); }
.keys-ccs__icon { color: var(--st-ink-2); }
.keys-ccs__title { font-size: 0.9rem; font-weight: 550; color: var(--st-ink); }
.keys-ccs__desc { font-size: 0.74rem; color: var(--st-ink-3); }

@media (min-width: 480px) {
  .keys-providers { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .keys-ccs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 720px) {
  .keys__head { flex-direction: row; align-items: flex-end; justify-content: space-between; }
  .keys__head-actions { padding-bottom: 6px; }
  .keys__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1100px) {
  .keys__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .keys__card { min-height: 280px; }
}
</style>