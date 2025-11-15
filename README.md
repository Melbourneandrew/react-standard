# React Standards - Canonical Example

A production-ready implementation of React architecture patterns demonstrating a modular, scalable approach to building modern applications with Next.js 15, React 19, and TanStack Query.

This project showcases a collection and items management system with proper separation of concerns, reusable patterns, and comprehensive CRUD operations.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Architecture

This project implements a modular, layered architecture organized by feature:

```
┌─────────────────────────────────────────────┐
│     Components (Presentation Layer)         │  ← ItemsList, ItemEditDialog
├─────────────────────────────────────────────┤
│     Manager Hooks (Business Logic)          │  ← useItemSearch, useItemDetail
├─────────────────────────────────────────────┤
│     Query Hooks (React Query Integration)   │  ← useItemsQuery, useItemCreateMutation
├─────────────────────────────────────────────┤
│     API Hooks (Data Access Layer)           │  ← useItemsApi, useCollectionsApi
├─────────────────────────────────────────────┤
│     Types (Type Definitions)                │  ← item.ts, collection.ts
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Contexts (Optional - State Aggregation)    │  ← ItemContext, CollectionContext
└─────────────────────────────────────────────┘
   Used when shared state is needed across
   multiple components in the tree
```

### Data Flow

```
User Action → Component → Context → Manager Hook → Query Hook → API Hook → API Route
                  ↑                                                              ↓
                  └───────────── React Query Cache Update ←──────────────────────┘
```

## 📁 Project Structure

> **Note:** The `app/api/` directory contains a fully functional mock API with in-memory data for both collections and items endpoints.

```
src/
├── app/
│   ├── collections/
│   │   └── [id]/page.tsx              # Collection items view
│   ├── layout.tsx                     # Root layout with providers
│   └── page.tsx                       # Welcome page with collection selector
│
├── components/
│   ├── Navbar.tsx                     # Navigation header
│   ├── WelcomeCard.tsx                # Home page welcome component
│   └── ui/                            # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
│
├── lib/
│   ├── hooks/
│   │   ├── useApi.ts                  # HTTP client wrapper
│   │   ├── useToast.ts                # Toast notifications
│   │   └── useQueryErrorEffect.ts     # Error handling utility
│   ├── types/
│   │   └── api-types.ts               # Common API types
│   └── utils.ts                       # Utility functions
│
├── modules/                           # Feature modules
│   ├── collections/
│   │   ├── components/
│   │   │   └── CollectionsSelectionDropdown.tsx
│   │   ├── contexts/
│   │   │   └── CollectionContext.tsx  # Collection state & navigation
│   │   ├── hooks/
│   │   │   ├── api/
│   │   │   │   └── useCollectionsApi.ts     # Collections API layer
│   │   │   └── query/
│   │   │       └── useCollectionsQuery.ts   # Collections React Query hook
│   │   └── types/
│   │       └── collection.ts          # Collection type definitions
│   │
│   └── items/
│       ├── components/
│       │   ├── ItemsList.tsx          # Items list with search/pagination
│       │   ├── ItemCreationDialog.tsx # Create item modal
│       │   ├── ItemEditDialog.tsx     # Edit item modal
│       │   ├── ItemDeleteDialog.tsx   # Delete confirmation modal
│       │   └── ItemViewDialog.tsx     # View item details modal
│       ├── contexts/
│       │   └── ItemContext.tsx        # Item state aggregation
│       ├── hooks/
│       │   ├── api/
│       │   │   └── useItemsApi.ts     # Items API layer
│       │   ├── query/
│       │   │   ├── useItemsQuery.ts          # Fetch items query
│       │   │   ├── useItemCreateMutation.ts  # Create mutation
│       │   │   ├── useItemUpdateMutation.ts  # Update mutation
│       │   │   └── useItemDeleteMutation.ts  # Delete mutation
│       │   ├── useItemSearch.ts       # Search & pagination logic
│       │   └── useItemDetail.ts       # Single item fetching
│       └── types/
│           └── item.ts                # Item type definitions
│
└── providers/
    └── QueryProvider.tsx              # React Query client setup
```

## 🎯 Key Concepts

### 1. Modular Organization

Features are organized into self-contained modules (e.g., `collections`, `items`) with all related code co-located:

```
modules/items/
  ├── components/     # UI components
  ├── contexts/       # State aggregation
  ├── hooks/          # Business logic, queries, and API
  └── types/          # Type definitions
```

### 2. API Hooks (Data Access Layer)

Pure API access functions that return typed promises. No React Query, just HTTP calls:

```typescript
const { fetchItems, createItem, updateItem } = useItemsApi();
const items = await fetchItems({ collectionId }); // Promise<Item[]>
```

### 3. Query Hooks (React Query Layer)

React Query integration that wraps API hooks with caching and state management:

```typescript
const { data, isLoading, refetch } = useItemsQuery(collectionId);
const { mutate: createItem } = useItemCreateMutation();
```

### 4. Manager Hooks (Business Logic Layer)

Compose query hooks with additional business logic like URL state management:

```typescript
const { items, setQuery, nextPage, previousPage } = useItemSearch();
// Manages search params in URL, pagination, and fetching
```

### 5. Context (State Aggregation)

Aggregates manager hooks to provide shared state across components:

```typescript
const { items, setQuery, currentPage, goToPage } = useItemContext();
// All item-related state in one place
```

### 6. Components (Presentation Layer)

UI components consume context and focus purely on rendering:

```typescript
function ItemsList() {
  const { items, isItemSearchLoading } = useItemContext();
  // Just render the UI
}
```
