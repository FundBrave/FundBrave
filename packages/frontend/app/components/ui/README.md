# CreatePost Component

A highly refactored and modular React component for creating posts and campaign updates in the FundBrave application.

## Overview

The `CreatePost` component has been completely refactored from a single large file into a modular, maintainable, and reusable component system. This refactoring improves code readability, maintainability, and extensibility.

## Architecture

### File Structure

```
CreatePost.tsx                 # Main component file
├── types/
│   └── CreatePost.types.ts   # TypeScript type definitions
├── constants/
│   └── CreatePost.constants.ts # Constants and configuration
├── hooks/
│   └── useCreatePost.ts       # Custom React hooks
└── utils/
    └── validation.utils.ts         # Form validation utilities
```

### Key Improvements

1. **Separation of Concerns**: Code is organized into logical modules
2. **Type Safety**: Comprehensive TypeScript interfaces and types
3. **Reusable Components**: Form fields and UI components are modular
4. **Better State Management**: Custom hooks for complex state logic
5. **Form Validation**: Robust validation with clear error handling
6. **Accessibility**: Improved ARIA labels and keyboard navigation
7. **Performance**: Optimized with useCallback and proper memoization
8. **Constants Management**: Centralized configuration values

## Components

### Main Components

- **CreatePost**: Main modal component
- **CreatePostForm**: Form for creating general posts
- **CreateCampaignUpdateForm**: Form for campaign updates
- **UserProfileHeader**: User profile display component
- **TabNavigation**: Tab switching interface

### Form Components

- **SelectField**: Reusable select dropdown with validation
- **InputField**: Reusable text input with validation
- **TextAreaField**: Reusable textarea with media actions
- **MediaActions**: Interactive media attachment buttons

### Utility Components

- **ModalBackdrop**: Backdrop with click-to-close and keyboard handling
- **GifIcon / PollIcon**: Custom SVG icons

## Usage

```tsx
import CreatePost from "./components/ui/CreatePost";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  const handlePublish = async (data) => {
    // Handle publish logic
    console.log("Publishing:", data);
  };

  return (
    <CreatePost
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onPublish={handlePublish}
      user={{
        name: "John Doe",
        avatar: "/avatar.jpg",
        audience: "Public",
      }}
      campaignCategories={["Health", "Education"]}
      userCampaigns={["My Campaign 1", "My Campaign 2"]}
    />
  );
}
```

## Props

### CreatePostProps

| Prop                 | Type                          | Required | Description                                      |
| -------------------- | ----------------------------- | -------- | ------------------------------------------------ |
| `isOpen`             | `boolean`                     | Yes      | Controls modal visibility                        |
| `onClose`            | `() => void`                  | Yes      | Called when modal should close                   |
| `onPublish`          | `(data: PublishData) => void` | Yes      | Called when content is published                 |
| `user`               | `UserProfile`                 | No       | User profile data (uses default if not provided) |
| `campaignCategories` | `string[]`                    | No       | Available campaign categories                    |
| `userCampaigns`      | `string[]`                    | No       | User's available campaigns                       |

## Data Types

### PublishData

The component returns different data structures based on the selected tab:

**Post Data:**

```typescript
{
  type: "post",
  content: string
}
```

**Campaign Update Data:**

```typescript
{
  type: "campaign-update",
  category: string,
  campaign: string,
  title: string,
  update: string
}
```

## Validation

The component uses **Zod** for robust, type-safe form validation:

### Zod Schemas

```typescript
import { postSchema, campaignUpdateSchema } from './utils/validation.utils';

// Post validation schema
const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content is required")
    .min(10, "Post content must be at least 10 characters long")
    .max(5000, "Post content must be less than 5000 characters"),
});

// Campaign update validation schema
const campaignUpdateSchema = z.object({
  category: z.string().min(1, "Campaign category is required"),
  campaign: z.string().min(1, "Campaign selection is required"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters long")
    .max(200, "Title must be less than 200 characters"),
  update: z
    .string()
    .trim()
    .min(1, "Update content is required")
    .min(10, "Update content must be at least 10 characters long")
    .max(5000, "Update content must be less than 5000 characters"),
});
```

### Validation Functions

The component provides both traditional error-based validation and safe parsing:

```typescript
import { 
  validatePostForm, 
  validateCampaignUpdateForm,
  safeValidatePost,
  safeValidateCampaignUpdate,
  getFirstError,
  VALIDATION_LIMITS 
} from './utils/validation.utils';

// Traditional validation (returns error objects)
const postErrors = validatePostForm(content);
const campaignErrors = validateCampaignUpdateForm(data);

// Check if form is valid
const isValid = isFormValid(postErrors);

// Get first error message
const firstError = getFirstError(postErrors);

// Safe parsing (returns success/error results)
const postResult = safeValidatePost(content);
const campaignResult = safeValidateCampaignUpdate(data);

if (postResult.success) {
  // postResult.data contains validated data with proper typing
  console.log(postResult.data.content);
} else {
  // postResult.error contains detailed Zod error information
  console.log(postResult.error.issues);
}
```

### Validation Features

- **Type Safety**: Schemas ensure runtime validation matches TypeScript types
- **Auto-trimming**: String fields are automatically trimmed
- **Custom Error Messages**: User-friendly error messages for each validation rule
- **Composable**: Schemas can be extended or combined for complex validation
- **Performance**: Zod provides fast validation with detailed error reporting
- **Type Inference**: Automatic TypeScript type generation from schemas

### Type Inference

Zod schemas automatically generate TypeScript types:

```typescript
import { PostFormData, CampaignUpdateFormData } from './utils/validation.utils';

// These types are automatically inferred from the Zod schemas:
// PostFormData = { content: string }
// CampaignUpdateFormData = { category: string; campaign: string; title: string; update: string }

function handleValidPost(data: PostFormData) {
  // data.content is guaranteed to be a valid string
  console.log(data.content);
}
```

### Validation Limits

The validation limits are now centralized as constants for easy maintenance:

```typescript
import { VALIDATION_LIMITS } from './utils/validation.utils';

export const VALIDATION_LIMITS = {
  POST_CONTENT_MIN: 10,
  POST_CONTENT_MAX: 5000,
  TITLE_MIN: 5,
  TITLE_MAX: 200,
  UPDATE_CONTENT_MIN: 10,
  UPDATE_CONTENT_MAX: 5000,
} as const;

// These constants are used in both the Zod schemas and can be referenced elsewhere
console.log(`Post content must be between ${VALIDATION_LIMITS.POST_CONTENT_MIN} and ${VALIDATION_LIMITS.POST_CONTENT_MAX} characters`);
```

### Utility Functions

Additional utility functions are provided for common validation tasks:

```typescript
import { isFormValid, getFirstError } from './utils/validation.utils';

// Check if a form has any validation errors
const errors = validatePostForm(content);
const isValid = isFormValid(errors); // boolean

// Get the first error message for display
const firstError = getFirstError(errors); // string | null

// Convert Zod errors to custom error format (internal function)
// This handles the conversion from Zod's error format to the component's expected format
```

### Error Handling

The validation system provides robust error handling:

- **Graceful Fallbacks**: If Zod validation fails unexpectedly, fallback error messages are provided
- **Detailed Error Information**: Zod provides specific field-level error messages
- **Error Conversion**: Zod errors are automatically converted to the component's expected error format
- **Type Safety**: All error handling maintains TypeScript type safety

### Media Actions

Media action handlers can be customized by modifying the `mediaActions` object:

```typescript
const mediaActions = {
  onImageClick: () => openImagePicker(),
  onGifClick: () => openGifPicker(),
  onPollClick: () => openPollCreator(),
  // ... other handlers
};
```

### Styling

The component uses Tailwind CSS with custom design tokens. Key styling can be modified in the constants file:

```typescript
export const MODAL_CONFIG = {
  MAX_WIDTH: "843px",
  MAX_HEIGHT: "90vh",
  // ... other dimensions
};
```

## Accessibility Features

- Full keyboard navigation support
- ARIA labels on all interactive elements
- Focus management for modal
- Screen reader friendly form labels
- Escape key to close modal

## Performance Considerations

- Form state is optimized with `useCallback`
- Validation runs only when necessary
- Media actions are memoized
- Component only re-renders when relevant props change

## Runtime Error Handling

- Form validation with user-friendly error messages
- Async publish error handling with loading states
- Network error recovery

## Migration to Zod

### From Previous Version

If you're upgrading from the previous manual validation version:

1. **Install Zod**:

   ```bash
   npm install zod
   ```

2. **Updated Imports**: The validation functions remain the same, but now use Zod internally:

   ```typescript
   // These imports remain unchanged
   import { validatePostForm, validateCampaignUpdateForm } from './utils/validation.utils';
   
   // New Zod-specific exports available
   import { 
     postSchema, 
     campaignUpdateSchema,
     PostFormData,
     CampaignUpdateFormData,
     VALIDATION_LIMITS 
   } from './utils/validation.utils';
   ```

3. **Backward Compatibility**: All existing validation function signatures remain the same, ensuring no breaking changes to your existing code.

4. **Enhanced Features**: You can now optionally use the new safe parsing functions and type inference capabilities.

## Future Enhancements

1. **Rich Text Editor**: Replace textarea with a rich text editor
2. **File Upload**: Implement actual file upload functionality
3. **Auto-save**: Add draft saving functionality
4. **Emoji Picker**: Integrate emoji picker component
5. **Mentions**: Add user mention functionality
6. **Hashtags**: Add hashtag support
7. **Preview Mode**: Add content preview before publishing

## Testing

The modular structure makes the component highly testable:

- Individual form components can be tested in isolation
- Validation functions are pure and easily testable
- Custom hooks can be tested with React Testing Library
- Mock external dependencies for consistent testing

## Dependencies

- React 18+
- Tailwind CSS
- Lucide React (for icons)
- TypeScript 4.5+
- **Zod** (for form validation)

### Installing Dependencies

To use this component with Zod validation, ensure Zod is installed:

```bash
npm install zod
# or
yarn add zod
# or
pnpm add zod
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+
