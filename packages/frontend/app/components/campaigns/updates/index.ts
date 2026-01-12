/**
 * Campaign Updates Components
 *
 * Components for displaying and managing campaign updates:
 * - UpdateCard: Display individual update with actions
 * - UpdateForm: Form for creating/editing updates
 * - UpdateModal: Modal wrapper for UpdateForm
 * - schemas: Zod validation schemas
 */

export { UpdateCard } from './UpdateCard';
export type { UpdateCardProps } from './UpdateCard';

export { UpdateForm } from './UpdateForm';
export type { UpdateFormProps } from './UpdateForm';

export { UpdateModal } from './UpdateModal';
export type { UpdateModalProps } from './UpdateModal';

export {
  campaignUpdateSchema,
  validateUpdateField,
  validateUpdateForm,
  type CampaignUpdateData,
} from './schemas';
