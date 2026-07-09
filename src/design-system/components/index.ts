export type { ComponentTokenRecord, ComponentTokenRegistry } from './types'

export { buttonTokens } from './button'
export { inputTokens } from './input'
export { cardTokens } from './card'
export { badgeTokens } from './badge'
export { modalTokens } from './modal'
export { sheetTokens } from './sheet'
export { tableTokens } from './table'
export { tabsTokens } from './tabs'
export { dropdownTokens } from './dropdown'
export { toastTokens } from './toast'
export { tooltipTokens } from './tooltip'
export { popoverTokens } from './popover'
export { selectTokens } from './select'
export { checkboxTokens } from './checkbox'
export { avatarTokens } from './avatar'
export { skeletonTokens } from './skeleton'
export { spinnerTokens } from './spinner'
export { formTokens } from './form'
export { labelTokens } from './label'
export { kbdTokens } from './kbd'
export { sidebarTokens } from './sidebar'
export { navbarTokens } from './navbar'
export { chartTokens } from './chart'
export { calendarTokens } from './calendar'
export { dataListTokens } from './data-list'
export { statusPillTokens } from './status-pill'
export { statusDotTokens } from './status-dot'
export { emptyStateTokens } from './empty-state'
export { filterBarTokens } from './filter-bar'
export { bulkActionBarTokens } from './bulk-action-bar'
export { splitDetailTokens } from './split-detail'
export { dashboardShellTokens } from './dashboard-shell'
export { dashboardSidebarTokens } from './dashboard-sidebar'
export { dashboardHeaderTokens } from './dashboard-header'
export { themeCustomizerTokens } from './theme-customizer'

import type { ComponentTokenRegistry } from './types'
import { buttonTokens } from './button'
import { inputTokens } from './input'
import { cardTokens } from './card'
import { badgeTokens } from './badge'
import { modalTokens } from './modal'
import { sheetTokens } from './sheet'
import { tableTokens } from './table'
import { tabsTokens } from './tabs'
import { dropdownTokens } from './dropdown'
import { toastTokens } from './toast'
import { tooltipTokens } from './tooltip'
import { popoverTokens } from './popover'
import { selectTokens } from './select'
import { checkboxTokens } from './checkbox'
import { avatarTokens } from './avatar'
import { skeletonTokens } from './skeleton'
import { spinnerTokens } from './spinner'
import { formTokens } from './form'
import { labelTokens } from './label'
import { kbdTokens } from './kbd'
import { sidebarTokens } from './sidebar'
import { navbarTokens } from './navbar'
import { chartTokens } from './chart'
import { calendarTokens } from './calendar'
import { dataListTokens } from './data-list'
import { statusPillTokens } from './status-pill'
import { statusDotTokens } from './status-dot'
import { emptyStateTokens } from './empty-state'
import { filterBarTokens } from './filter-bar'
import { bulkActionBarTokens } from './bulk-action-bar'
import { splitDetailTokens } from './split-detail'
import { dashboardShellTokens } from './dashboard-shell'
import { dashboardSidebarTokens } from './dashboard-sidebar'
import { dashboardHeaderTokens } from './dashboard-header'
import { themeCustomizerTokens } from './theme-customizer'

export const componentTokenRegistry: ComponentTokenRegistry = {
  button: buttonTokens,
  input: inputTokens,
  card: cardTokens,
  badge: badgeTokens,
  modal: modalTokens,
  sheet: sheetTokens,
  table: tableTokens,
  tabs: tabsTokens,
  dropdown: dropdownTokens,
  toast: toastTokens,
  tooltip: tooltipTokens,
  popover: popoverTokens,
  select: selectTokens,
  checkbox: checkboxTokens,
  avatar: avatarTokens,
  skeleton: skeletonTokens,
  spinner: spinnerTokens,
  form: formTokens,
  label: labelTokens,
  kbd: kbdTokens,
  sidebar: sidebarTokens,
  navbar: navbarTokens,
  chart: chartTokens,
  calendar: calendarTokens,
  dataList: dataListTokens,
  statusPill: statusPillTokens,
  statusDot: statusDotTokens,
  emptyState: emptyStateTokens,
  filterBar: filterBarTokens,
  bulkActionBar: bulkActionBarTokens,
  splitDetail: splitDetailTokens,
  dashboardShell: dashboardShellTokens,
  dashboardSidebar: dashboardSidebarTokens,
  dashboardHeader: dashboardHeaderTokens,
  themeCustomizer: themeCustomizerTokens,
}
