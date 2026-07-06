'use client';

import React from 'react';
import {
  Globe,
  Palette,
  Activity,
  Bell,
  LayoutDashboard,
  Accessibility,
  Sun,
  Moon,
  Laptop,
  RotateCcw,
  Check,
  ChevronDown,
  Info,
  Zap,
  Shield,
  Monitor,
} from 'lucide-react';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import {
  usePreferencesStore,
  type UserPreferences,
  type LandingPage,
  type DateFormat,
  type NumberFormat,
  type CardDensity,
  type FontScale,
  type LiveUpdateMode,
  type DefaultPageSize,
  type DefaultSorting,
  type PreferenceSectionKey,
} from '../../../store/preferences';
import { useThemeStore } from '../../../store/theme';
import { LiveContext } from '../../../lib/live/LiveContext';
import {
  globalPollingController,
  type PollingInterval,
} from '../../../lib/live/PollingController';
import { cn } from '../../../lib/utils';

// ─── Tab Configuration ────────────────────────────────────────────────────────

type TabId =
  | 'general'
  | 'appearance'
  | 'live-updates'
  | 'notifications'
  | 'dashboard'
  | 'accessibility';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const TABS: Tab[] = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'live-updates', label: 'Live Updates', icon: Activity },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
];

// ─── Primitive UI Components ─────────────────────────────────────────────────

function SettingsCard({
  title,
  description,
  children,
  onReset,
  sectionKey,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onReset?: () => void;
  sectionKey?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200">
      <div className="flex items-start justify-between p-5 border-b border-border/40 bg-muted/5">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {onReset && (
          <button
            aria-label={`Reset ${title}`}
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-4 flex-shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
  htmlFor,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={htmlFor}
          className={cn(
            'text-sm font-medium text-foreground',
            htmlFor && 'cursor-pointer',
          )}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-primary' : 'bg-muted-foreground/25',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-1',
        )}
      />
    </button>
  );
}

function RadioPill<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (v: T) => void;
  options: {
    value: T;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            id={`${name}-${opt.value}`}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
              isSelected
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-muted/30',
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SettingsSelect<T extends string | number>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  id?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const num = Number(raw);
          const isNumeric =
            !isNaN(num) &&
            raw.trim() !== '' &&
            options.some((o) => o.value === num);
          onChange((isNumeric ? num : raw) as T);
        }}
        className={cn(
          'flex h-8 min-w-[140px] rounded-lg border border-input bg-background pr-8 pl-3 py-1 text-xs',
          'ring-offset-background transition-shadow appearance-none cursor-pointer text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {options.map((opt) => (
          <option
            key={String(opt.value)}
            value={String(opt.value)}
            className="bg-card text-foreground"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
    </div>
  );
}

function Callout({
  children,
  variant = 'info',
}: {
  children: React.ReactNode;
  variant?: 'info' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-4 py-3 text-xs space-y-1 border',
        variant === 'info'
          ? 'bg-primary/5 border-primary/20 text-muted-foreground'
          : 'bg-amber-500/5 border-amber-500/20 text-muted-foreground',
      )}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border/50" />;
}

// ─── Saved Indicator ──────────────────────────────────────────────────────────

function SavedIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium text-emerald-500 transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
      )}
    >
      <div className="h-4 w-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <Check className="h-2.5 w-2.5" />
      </div>
      Saved
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('general');
  const [saved, setSaved] = React.useState(false);

  const { preferences, updatePreferences, resetSection, resetAll } =
    usePreferencesStore();
  const { theme, setTheme } = useThemeStore();
  const liveCtx = React.useContext(LiveContext);

  // Flash the "Saved" indicator on any preference change
  const update = React.useCallback(
    (patch: Partial<UserPreferences>) => {
      updatePreferences(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    },
    [updatePreferences],
  );

  // Update both store + live controller together
  const updateLiveInterval = React.useCallback(
    (interval: PollingInterval) => {
      update({ pollingInterval: interval });
      if (liveCtx) {
        liveCtx.setPollingInterval(interval);
      } else {
        globalPollingController.setInterval(interval);
      }
    },
    [update, liveCtx],
  );

  const handleResetAll = () => {
    resetAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <DashboardContainer>
      <PageHeader
        title="Settings & Preferences"
        description="Configure your workspace, appearance, live data behavior, and accessibility. All changes take effect immediately."
        actions={
          <div className="flex items-center gap-3">
            <SavedIndicator visible={saved} />
            <button
              id="reset-all-preferences"
              onClick={handleResetAll}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border',
                'text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all',
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All
            </button>
          </div>
        }
      />

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/40 flex-wrap"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`settings-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40',
              )}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ────────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id={`settings-panel-${activeTab}`}
        aria-labelledby={`settings-tab-${activeTab}`}
        className="space-y-4"
      >
        {/* ── General ─────────────────────────────────────────────────────── */}
        {activeTab === 'general' && (
          <>
            <SettingsCard
              title="Navigation"
              description="Default destination when you log in or return to the dashboard."
              onReset={() => {
                resetSection('general');
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              }}
            >
              <SettingRow
                htmlFor="default-landing-page"
                label="Default Landing Page"
                description="The first page you see after authenticating."
              >
                <SettingsSelect<LandingPage>
                  id="default-landing-page"
                  value={preferences.defaultLandingPage}
                  onChange={(v) => update({ defaultLandingPage: v })}
                  options={[
                    { value: '/dashboard', label: 'Overview' },
                    { value: '/dashboard/jobs', label: 'Jobs' },
                    { value: '/dashboard/workers', label: 'Workers' },
                    { value: '/dashboard/queues', label: 'Queues' },
                    { value: '/dashboard/metrics', label: 'Metrics' },
                    {
                      value: '/dashboard/activity',
                      label: 'Activity Timeline',
                    },
                  ]}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Regional"
              description="Timezone, date, and number display preferences."
            >
              <SettingRow
                htmlFor="timezone"
                label="Timezone"
                description="Reference timezone used when displaying all timestamps."
              >
                <SettingsSelect<string>
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(v) => update({ timezone: v })}
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'local', label: 'Local (Browser)' },
                    { value: 'America/New_York', label: 'Eastern (ET)' },
                    { value: 'America/Chicago', label: 'Central (CT)' },
                    { value: 'America/Denver', label: 'Mountain (MT)' },
                    { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
                    { value: 'Europe/London', label: 'London (GMT)' },
                    { value: 'Europe/Paris', label: 'Paris (CET)' },
                    { value: 'Asia/Kolkata', label: 'India (IST)' },
                    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
                    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
                    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
                  ]}
                />
              </SettingRow>

              <Divider />

              <SettingRow
                label="Date Format"
                description="How timestamps are displayed throughout the dashboard."
              >
                <RadioPill<DateFormat>
                  name="date-format"
                  value={preferences.dateFormat}
                  onChange={(v) => update({ dateFormat: v })}
                  options={[
                    { value: 'relative', label: 'Relative' },
                    { value: 'absolute-short', label: 'Short' },
                    { value: 'absolute-long', label: 'Long' },
                    { value: 'iso', label: 'ISO 8601' },
                  ]}
                />
              </SettingRow>

              <Divider />

              <SettingRow
                label="Number Format"
                description="How large numbers are displayed in metrics and counts."
              >
                <RadioPill<NumberFormat>
                  name="number-format"
                  value={preferences.numberFormat}
                  onChange={(v) => update({ numberFormat: v })}
                  options={[
                    { value: 'compact', label: 'Compact (1.2K)' },
                    { value: 'full', label: 'Full (1,200)' },
                  ]}
                />
              </SettingRow>
            </SettingsCard>
          </>
        )}

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        {activeTab === 'appearance' && (
          <>
            <SettingsCard
              title="Color Theme"
              description="Application-wide color scheme. Changes apply instantly."
              onReset={() => {
                resetSection('appearance');
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              }}
            >
              <SettingRow
                label="Theme"
                description="Choose between light, dark, or follow the system preference."
              >
                <RadioPill<'light' | 'dark' | 'system'>
                  name="color-theme"
                  value={theme}
                  onChange={(v) => setTheme(v)}
                  options={[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Laptop },
                  ]}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Density"
              description="Control the spacing and compactness of the interface."
            >
              <SettingRow
                label="Card Density"
                description="Affects padding and whitespace in content cards."
              >
                <RadioPill<CardDensity>
                  name="card-density"
                  value={preferences.cardDensity}
                  onChange={(v) => update({ cardDensity: v })}
                  options={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'spacious', label: 'Spacious' },
                  ]}
                />
              </SettingRow>

              <Divider />

              <SettingRow
                htmlFor="compact-mode"
                label="Compact Mode"
                description="Reduce padding and margins across all views for more information density."
              >
                <Toggle
                  id="compact-mode"
                  checked={preferences.compactMode}
                  onChange={(v) => update({ compactMode: v })}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Navigation"
              description="Sidebar and layout defaults."
            >
              <SettingRow
                htmlFor="sidebar-default-open"
                label="Sidebar Expanded by Default"
                description="Show the sidebar expanded when the dashboard first loads."
              >
                <Toggle
                  id="sidebar-default-open"
                  checked={preferences.sidebarDefaultOpen}
                  onChange={(v) => update({ sidebarDefaultOpen: v })}
                />
              </SettingRow>
            </SettingsCard>
          </>
        )}

        {/* ── Live Updates ─────────────────────────────────────────────────── */}
        {activeTab === 'live-updates' && (
          <>
            <SettingsCard
              title="Auto Refresh"
              description="Controls how and when the dashboard fetches fresh data from the backend."
              onReset={() => {
                resetSection('liveUpdates');
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              }}
            >
              <SettingRow
                htmlFor="auto-refresh"
                label="Enable Auto Refresh"
                description="Automatically reload dashboard data on a fixed interval."
              >
                <Toggle
                  id="auto-refresh"
                  checked={preferences.autoRefresh}
                  onChange={(v) => {
                    update({ autoRefresh: v });
                    const target = v
                      ? preferences.pollingInterval
                      : ('off' as PollingInterval);
                    if (liveCtx) {
                      liveCtx.setPollingInterval(target);
                    } else {
                      globalPollingController.setInterval(target);
                    }
                  }}
                />
              </SettingRow>

              <Divider />

              <SettingRow
                htmlFor="polling-interval"
                label="Refresh Interval"
                description="How frequently data is automatically fetched when auto refresh is enabled."
              >
                <SettingsSelect<string>
                  id="polling-interval"
                  value={String(preferences.pollingInterval)}
                  onChange={(v) => {
                    const numVal = Number(v);
                    const interval: PollingInterval =
                      v === 'manual' || v === 'off'
                        ? v
                        : (numVal as PollingInterval);
                    updateLiveInterval(interval);
                  }}
                  options={[
                    { value: '5000', label: 'Every 5 seconds' },
                    { value: '10000', label: 'Every 10 seconds' },
                    { value: '30000', label: 'Every 30 seconds' },
                    { value: '60000', label: 'Every 60 seconds' },
                    { value: 'manual', label: 'Manual only' },
                    { value: 'off', label: 'Disabled' },
                  ]}
                />
              </SettingRow>

              <Divider />

              <SettingRow
                htmlFor="pause-when-hidden"
                label="Pause When Tab Hidden"
                description="Stop polling when the browser tab is inactive. Resumes automatically when you return."
              >
                <Toggle
                  id="pause-when-hidden"
                  checked={preferences.pauseWhenHidden}
                  onChange={(v) => update({ pauseWhenHidden: v })}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Update Mode"
              description="Choose the data streaming strategy for live views."
            >
              <SettingRow
                label="Live Update Mode"
                description="How data updates are delivered to the dashboard."
              >
                <RadioPill<LiveUpdateMode>
                  name="live-update-mode"
                  value={preferences.liveUpdateMode}
                  onChange={(v) => update({ liveUpdateMode: v })}
                  options={[
                    { value: 'polling', label: 'Polling', icon: Activity },
                    { value: 'auto', label: 'Auto', icon: Zap },
                    { value: 'manual', label: 'Manual', icon: Shield },
                  ]}
                />
              </SettingRow>

              <Callout variant="info">
                <p className="font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  Mode descriptions
                </p>
                <p>
                  <span className="text-foreground font-semibold">Polling</span>{' '}
                  — Fetches data at your configured interval using HTTP
                  requests.
                </p>
                <p>
                  <span className="text-foreground font-semibold">Auto</span> —
                  Uses Server-Sent Events when available, falls back to polling
                  automatically.
                </p>
                <p>
                  <span className="text-foreground font-semibold">Manual</span>{' '}
                  — Data only refreshes when you explicitly click the refresh
                  button.
                </p>
              </Callout>
            </SettingsCard>

            <SettingsCard
              title="Relative Timestamps"
              description="How frequently relative time labels are recalculated."
            >
              <SettingRow
                htmlFor="relative-time-freq"
                label="Update Frequency"
                description="Controls how often '3 minutes ago' style timestamps refresh."
              >
                <SettingsSelect<number>
                  id="relative-time-freq"
                  value={preferences.relativeTimeUpdateFrequency}
                  onChange={(v) =>
                    update({
                      relativeTimeUpdateFrequency: Number(v) as
                        1000 | 5000 | 30000,
                    })
                  }
                  options={[
                    { value: 1000, label: 'Every second' },
                    { value: 5000, label: 'Every 5 seconds' },
                    { value: 30000, label: 'Every 30 seconds' },
                  ]}
                />
              </SettingRow>
            </SettingsCard>
          </>
        )}

        {/* ── Notifications ────────────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <>
            <SettingsCard
              title="System Alerts"
              description="Global notification categories shown as toast messages."
              onReset={() => {
                resetSection('notifications');
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              }}
            >
              {(
                [
                  {
                    key: 'successNotifications' as const,
                    label: 'Success Notifications',
                    description:
                      'Show confirmation toasts for successful operations (job submissions, state changes).',
                  },
                  {
                    key: 'errorNotifications' as const,
                    label: 'Error Notifications',
                    description:
                      'Show error toasts when API calls or operations fail.',
                  },
                  {
                    key: 'warningNotifications' as const,
                    label: 'Warning Notifications',
                    description:
                      'Show warning toasts for degraded states and potential issues.',
                  },
                ] as const
              ).map(({ key, label, description }, i) => (
                <React.Fragment key={key}>
                  {i > 0 && <Divider />}
                  <SettingRow
                    htmlFor={key}
                    label={label}
                    description={description}
                  >
                    <Toggle
                      id={key}
                      checked={preferences[key]}
                      onChange={(v) => update({ [key]: v })}
                    />
                  </SettingRow>
                </React.Fragment>
              ))}
            </SettingsCard>

            <SettingsCard
              title="Subsystem Alerts"
              description="Notifications scoped to specific scheduler subsystems."
            >
              {(
                [
                  {
                    key: 'schedulerNotifications' as const,
                    label: 'Scheduler Notifications',
                    description:
                      'Alerts for promotion cycle events and scheduler status changes.',
                  },
                  {
                    key: 'retryNotifications' as const,
                    label: 'Retry Notifications',
                    description:
                      'Alerts for retry attempts, backoff delays, and retry exhaustion.',
                  },
                  {
                    key: 'dlqNotifications' as const,
                    label: 'DLQ Notifications',
                    description:
                      'Alerts for dead letter queue entries, replays, and purge operations.',
                  },
                ] as const
              ).map(({ key, label, description }, i) => (
                <React.Fragment key={key}>
                  {i > 0 && <Divider />}
                  <SettingRow
                    htmlFor={key}
                    label={label}
                    description={description}
                  >
                    <Toggle
                      id={key}
                      checked={preferences[key]}
                      onChange={(v) => update({ [key]: v })}
                    />
                  </SettingRow>
                </React.Fragment>
              ))}
            </SettingsCard>
          </>
        )}

        {/* ── Dashboard ───────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            <SettingsCard
              title="Pagination"
              description="Default number of items per page in data tables."
              onReset={() => {
                resetSection('dashboard');
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              }}
            >
              <SettingRow
                label="Default Page Size"
                description="Number of rows displayed per page in all data tables across the dashboard."
              >
                <RadioPill<string>
                  name="default-page-size"
                  value={String(preferences.defaultPageSize)}
                  onChange={(v) =>
                    update({ defaultPageSize: Number(v) as DefaultPageSize })
                  }
                  options={[
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                  ]}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Sorting"
              description="Default sort order when viewing data lists."
            >
              <SettingRow
                htmlFor="default-sorting"
                label="Default Sort Field"
                description="The initial sort column applied to all data tables when first loaded."
              >
                <SettingsSelect<DefaultSorting>
                  id="default-sorting"
                  value={preferences.defaultSorting}
                  onChange={(v) => update({ defaultSorting: v })}
                  options={[
                    { value: 'createdAt', label: 'Created At' },
                    { value: 'updatedAt', label: 'Updated At' },
                    { value: 'status', label: 'Status' },
                  ]}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Workspace"
              description="Organization and project context behavior."
            >
              <SettingRow
                htmlFor="persist-workspace"
                label="Persist Workspace Selection"
                description="Remember your selected organization and project across browser sessions."
              >
                <Toggle
                  id="persist-workspace"
                  checked={preferences.persistWorkspace}
                  onChange={(v) => update({ persistWorkspace: v })}
                />
              </SettingRow>
            </SettingsCard>
          </>
        )}

        {/* ── Accessibility ─────────────────────────────────────────────── */}
        {activeTab === 'accessibility' && (
          <>
            <SettingsCard
              title="Motion & Animation"
              description="Reduce or eliminate animations across the interface."
              onReset={() => {
                resetSection('accessibility');
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              }}
            >
              <SettingRow
                htmlFor="reduced-motion"
                label="Reduced Motion"
                description="Minimizes all transitions and animations. Recommended for users with vestibular disorders or motion sensitivity."
              >
                <Toggle
                  id="reduced-motion"
                  checked={preferences.reducedMotion}
                  onChange={(v) => update({ reducedMotion: v })}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Visual"
              description="Contrast and legibility enhancements."
            >
              <SettingRow
                htmlFor="high-contrast"
                label="High Contrast Mode"
                description="Increase foreground and border contrast ratios for improved legibility."
              >
                <Toggle
                  id="high-contrast"
                  checked={preferences.highContrast}
                  onChange={(v) => update({ highContrast: v })}
                />
              </SettingRow>

              <Divider />

              <SettingRow
                label="Font Scale"
                description="Adjust the base font size across the entire interface. Applies to all text."
              >
                <RadioPill<FontScale>
                  name="font-scale"
                  value={preferences.fontScale}
                  onChange={(v) => update({ fontScale: v })}
                  options={[
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' },
                    { value: 'xl', label: 'XL' },
                  ]}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Navigation"
              description="Keyboard and focus interaction preferences."
            >
              <SettingRow
                htmlFor="keyboard-nav"
                label="Keyboard Navigation Enhancements"
                description="Add prominent focus rings and enhanced keyboard shortcuts across all interactive elements."
              >
                <Toggle
                  id="keyboard-nav"
                  checked={preferences.keyboardNavEnhancements}
                  onChange={(v) => update({ keyboardNavEnhancements: v })}
                />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Developer"
              description="Advanced diagnostic and debugging options."
            >
              <SettingRow
                htmlFor="developer-mode"
                label="Developer Mode"
                description="Enable additional diagnostic information, query timings, and debug panels throughout the dashboard."
              >
                <Toggle
                  id="developer-mode"
                  checked={preferences.developerMode}
                  onChange={(v) => update({ developerMode: v })}
                />
              </SettingRow>

              {preferences.developerMode && (
                <Callout variant="warning">
                  <p className="font-semibold text-amber-400 mb-1">
                    Developer Mode Active
                  </p>
                  <p>
                    Debug panels and query performance timings are visible
                    across the dashboard. Disable before sharing screenshots or
                    recordings.
                  </p>
                </Callout>
              )}
            </SettingsCard>

            {/* WCAG info callout */}
            <Callout variant="info">
              <p className="font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <Monitor className="h-3.5 w-3.5 text-primary" />
                System Accessibility Preferences
              </p>
              <p>
                TaskFlow also respects your OS-level accessibility settings. If
                your system has{' '}
                <span className="text-foreground font-medium">
                  Reduce Motion
                </span>{' '}
                enabled in Accessibility preferences, animations are
                automatically minimized regardless of this setting.
              </p>
            </Callout>
          </>
        )}
      </div>

      {/* ── Current Settings Summary ────────────────────────────────────── */}
      <div className="rounded-xl border border-border/40 bg-muted/10 p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Active Configuration Summary
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Theme', value: theme },
            {
              label: 'Refresh',
              value: preferences.autoRefresh
                ? `${preferences.pollingInterval === 10000 ? '10s' : preferences.pollingInterval === 5000 ? '5s' : preferences.pollingInterval === 30000 ? '30s' : preferences.pollingInterval === 60000 ? '60s' : String(preferences.pollingInterval)}`
                : 'Off',
            },
            { label: 'Date', value: preferences.dateFormat },
            { label: 'Page Size', value: String(preferences.defaultPageSize) },
            { label: 'Font', value: preferences.fontScale },
            {
              label: 'Timezone',
              value:
                preferences.timezone === 'local'
                  ? 'Local'
                  : preferences.timezone,
            },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                {label}
              </p>
              <p className="text-xs font-medium text-foreground truncate">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </DashboardContainer>
  );
}
