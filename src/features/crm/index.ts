/**
 * Barrel export para el feature de CRM.
 */

export {
  DealPipeline,
  type Deal,
  type DealStage,
  type DealPipelineProps,
} from "./deal-pipeline";
export { DealList, type DealListProps } from "./deal-list";
export { DealDetail, type DealDetailProps } from "./deal-detail";
export {
  LeadInbox,
  type LeadInboxItem,
  type LeadInboxProps,
  type LeadRisk,
} from "./lead-inbox";
