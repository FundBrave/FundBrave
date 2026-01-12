# Search Feature

Comprehensive search system for FundBrave with global Cmd+K modal, filters, and results page.

## Components

### SearchModal
Global search modal triggered by Cmd+K (Mac) or Ctrl+K (Windows/Linux).

**Features:**
- Instant search with debouncing (300ms)
- Recent searches (stored in localStorage, max 10)
- Trending campaigns/tags
- Category quick filters
- Keyboard navigation (Arrow keys, Enter, Escape)
- Shows 3 campaign results + 2 user results
- Focus trap and accessibility

**Usage:**
```tsx
import { SearchModal } from '@/app/components/search';

<SearchModal isOpen={isOpen} onClose={handleClose} />
```

The modal is automatically registered in the app layout via `SearchProvider`.

### SearchInput
Reusable search input component with clear button.

**Props:**
- `value?: string` - Controlled value
- `onChange?: (value: string) => void` - Change handler
- `onClear?: () => void` - Clear button handler
- `placeholder?: string` - Placeholder text
- `autoFocus?: boolean` - Auto-focus on mount
- `onKeyDown?: (e: React.KeyboardEvent) => void` - Keyboard handler

**Usage:**
```tsx
import { SearchInput } from '@/app/components/search';

<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="Search campaigns..."
/>
```

### SearchFilters
Desktop sidebar filters with categories, status, verified toggle, and funding range.

**Props:**
- `filters: SearchFiltersState` - Current filter state
- `onChange: (filters: SearchFiltersState) => void` - Filter change handler

**Usage:**
```tsx
import { SearchFilters } from '@/app/components/search';

<SearchFilters filters={filters} onChange={setFilters} />
```

### SearchFilterSheet
Mobile bottom sheet version of filters with Apply/Clear buttons.

**Props:**
- `isOpen: boolean` - Sheet visibility
- `onClose: () => void` - Close handler
- `filters: SearchFiltersState` - Current filter state
- `onChange: (filters: SearchFiltersState) => void` - Filter change handler

**Usage:**
```tsx
import { SearchFilterSheet } from '@/app/components/search';

<SearchFilterSheet
  isOpen={isOpen}
  onClose={handleClose}
  filters={filters}
  onChange={setFilters}
/>
```

### SearchResults
Results grid with empty state, loading skeleton, and pagination.

**Props:**
- `campaigns: CampaignCardProps[]` - Campaigns to display
- `isLoading?: boolean` - Loading state
- `totalCount?: number` - Total result count
- `hasMore?: boolean` - Show load more button
- `onLoadMore?: () => void` - Load more handler

**Usage:**
```tsx
import { SearchResults } from '@/app/components/search';

<SearchResults
  campaigns={campaigns}
  totalCount={total}
  hasMore={hasMore}
  onLoadMore={loadMore}
/>
```

### SearchSortDropdown
Dropdown for sorting results.

**Options:**
- Relevance (default)
- Most Recent
- Most Popular
- Ending Soon
- Most Raised

**Usage:**
```tsx
import { SearchSortDropdown } from '@/app/components/search';

<SearchSortDropdown value={sort} onChange={setSort} />
```

### CategoryChips
Horizontal scrollable category chips for filtering.

**Usage:**
```tsx
import { CategoryChips } from '@/app/components/search';

<CategoryChips
  selectedCategories={categories}
  onCategoryToggle={handleToggle}
/>
```

### RecentSearches
Display recent searches from localStorage with clear functionality.

**Usage:**
```tsx
import { RecentSearches, addRecentSearch } from '@/app/components/search';

// Display recent searches
<RecentSearches onSearchClick={handleClick} />

// Add to recent searches
addRecentSearch('medical emergency');
```

### TrendingCampaigns
Display trending topics as clickable tags.

**Usage:**
```tsx
import { TrendingCampaigns } from '@/app/components/search';

<TrendingCampaigns onTagClick={handleClick} />
```

## Pages

### /search
Search results page with URL parameter state management.

**URL Parameters:**
- `q` - Search query
- `categories` - Comma-separated category IDs
- `status` - Campaign status (all, active, ending_soon, completed)
- `sort` - Sort option (relevance, recent, popular, ending_soon, most_raised)

**Example:**
```
/search?q=medical&categories=health-medical,emergency&status=active&sort=recent
```

## Data

### Mock Data
Located in `mockData.ts`:
- `MOCK_CAMPAIGNS` - 15 sample campaigns
- `MOCK_USERS` - 5 sample users

### Categories
Available categories defined in `CategoryChips.tsx`:
- Health & Medical
- Education
- Environment
- Emergency
- Animals
- Community
- Technology
- Creative
- Sports
- Other

## Keyboard Shortcuts

- **Cmd+K / Ctrl+K** - Open search modal
- **Escape** - Close search modal
- **Arrow Up/Down** - Navigate results
- **Enter** - Select result or search

## LocalStorage

### Recent Searches
- **Key:** `fundbrave_recent_searches`
- **Type:** `string[]`
- **Max:** 10 items
- **Format:** `["query1", "query2", ...]`

## Accessibility

- All interactive elements have 44px minimum touch targets
- Focus trap in modal
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly

## Animations

Defined in `globals.css`:
- `animate-fade-in` - Backdrop fade
- `animate-slide-down` - Modal slide down
- `animate-slide-up` - Sheet slide up

## Mobile Considerations

- Horizontal scroll for category chips
- Bottom sheet for filters on mobile
- Single column results on mobile
- Touch-optimized button sizes (44px min)

## Future Enhancements

- Backend integration (GraphQL queries)
- Debounced API search
- Advanced filters (date range, location)
- Search history with timestamps
- Search suggestions/autocomplete
- Save search functionality
- Search analytics
