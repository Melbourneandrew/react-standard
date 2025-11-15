# React Query Conventions

## Key Principle: Declarative vs Imperative

### **useQuery** - Declarative (Automatic)

Use `useQuery` when you want data to **load automatically** and stay in sync.

```typescript
// ✅ GOOD: Declarative - loads automatically when itemId changes
function ItemViewDialog({ itemId }: { itemId: string | null }) {
  const { item, isLoadingItem, itemError } = useItemDetail(itemId);
  // Data fetches automatically, updates when itemId changes
}
```

**When to use:**

- Rendering data in UI (details, lists, cards)
- Data that should refresh when dependencies change
- Background data syncing

### **useMutation** - Imperative (On Demand)

Use `useMutation` for actions triggered **by user events**.

```typescript
// ✅ GOOD: Imperative - only updates when user clicks save
function ItemEditDialog({ item }: { item: Item }) {
  const { updateItemAsync, isUpdatingItem } = useItemManager();

  const handleSave = async () => {
    await updateItemAsync({ itemId: item.id, data });
  };
}
```

**When to use:**

- User actions (save, delete, create)
- Button clicks, form submissions
- Operations that modify data

---

## Architecture Patterns

### 1. **API Hook** - Repository Layer

Raw API calls, no state management.

```typescript
// hooks/api/useItemsApi.ts
export function useItemsApi() {
  const { callApi } = useApi();

  // Naming: fetch (GET), create (POST), update (PATCH), delete (DELETE)
  const fetchItemApi = useCallback(
    async (itemId: string): Promise<Item> => {
      return await callApi("GET", `/api/items/${itemId}`);
    },
    [callApi]
  );

  return { fetchItemApi, updateItemApi, deleteItemApi };
}
```

**Conventions:**

- Hook name ends with "Api"
- Methods end with "Api"
- Verbs: `fetch`, `create`, `update`, `delete`

### 2. **Detail Hook** - Declarative Query

Wraps `useQuery` for fetching individual items.

```typescript
// hooks/useItemDetail.ts
export function useItemDetail(itemId: string | null) {
  const { fetchItemApi } = useItemsApi();

  const {
    data: item,
    isLoading: isLoadingItem,
    error: itemError,
  } = useQuery<Item>({
    queryKey: ["item", itemId],
    queryFn: () => fetchItemApi(itemId!),
    enabled: !!itemId, // Only fetch if itemId provided
  });

  return { item, isLoadingItem, itemError };
}
```

**Conventions:**

- Name: `use[Domain]Detail`
- Uses `useQuery` for declarative fetching
- Domain-specific exports: `item`, `isLoadingItem`, `itemError`
- `enabled` flag controls when to fetch

### 3. **Manager Hook** - Imperative Mutations

Wraps `useMutation` for update/delete operations.

```typescript
// hooks/useItemManager.ts
export function useItemManager() {
  const { updateItemApi, deleteItemApi } = useItemsApi();

  const {
    mutateAsync: updateItemAsync,
    isPending: isUpdatingItem,
    error: itemUpdateError,
  } = useMutation({
    mutationFn: ({ itemId, data }) => updateItemApi(itemId, data),
  });

  return { updateItemAsync, isUpdatingItem, itemUpdateError };
}
```

**Conventions:**

- Name: `use[Domain]Manager`
- Uses `useMutation` for imperative operations
- Verbs: `updateItemAsync`, `deleteItemAsync`
- Domain-specific loading states: `isUpdatingItem`, `isDeletingItem`
- Domain-specific errors: `itemUpdateError`, `itemDeleteError`

### 4. **Search Hook** - Declarative Query with State

Combines `useQuery` with local state for filters/pagination.

```typescript
// hooks/useItemSearch.ts
export function useItemSearch(projectId: string) {
  const [searchParams, setSearchParams] = useState<ItemSearchParams>({
    page: 1,
    page_size: 5,
  });

  const {
    data: searchResponse,
    isLoading: isItemSearchLoading,
    error: itemSearchError,
  } = useQuery<ItemSearchResponse>({
    queryKey: ["items", "search", projectId, searchParams],
    queryFn: () => searchItemsApi(projectId, searchParams),
  });

  return {
    items: searchResponse?.items || [],
    isItemSearchLoading,
    itemSearchError,
    setQuery: (query) => setSearchParams((prev) => ({ ...prev, query })),
  };
}
```

**Conventions:**

- Name: `use[Domain]Search`
- Manages filter/pagination state locally
- Uses `useQuery` for automatic refetching when params change
- Domain-specific exports: `isItemSearchLoading`, `itemSearchError`

---

## Component Patterns

### Dialog with Declarative Query

```typescript
// components/ItemViewDialog.tsx
function ItemViewDialog({ itemId, onClose }: Props) {
  // ✅ Declarative: Automatically fetches when itemId changes
  const { item, isLoadingItem, itemError } = useItemDetail(itemId);

  return (
    <Dialog open={!!itemId} onOpenChange={onClose}>
      <DialogContent>
        {isLoadingItem && <Loader />}
        {itemError && <Error message={itemError.message} />}
        {item && <ItemDetails item={item} />}
      </DialogContent>
    </Dialog>
  );
}
```

**Why declarative?**

- Dialog needs to show data → use `useQuery`
- Data loads automatically when dialog opens
- Loading/error states handled declaratively
- No manual `useEffect` needed

### Dialog with Imperative Mutation

```typescript
// components/ItemEditDialog.tsx
function ItemEditDialog({ item, onClose }: Props) {
  const [name, setName] = useState(item?.name || "");

  // ✅ Imperative: Only updates when user clicks save
  const { updateItemAsync, isUpdatingItem } = useItemManager();

  const handleSave = async () => {
    await updateItemAsync({ itemId: item.id, data: { name } });
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={handleSave} disabled={isUpdatingItem}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

**Why imperative?**

- Form submission is a user action → use `useMutation`
- Update only happens when user clicks save
- Form state managed locally with `useState`

---

## Naming Conventions Summary

### Hooks

| Pattern              | Example          | Usage                           |
| -------------------- | ---------------- | ------------------------------- |
| `use[Domain]Api`     | `useItemsApi`    | Raw API calls                   |
| `use[Domain]Detail`  | `useItemDetail`  | Fetch single item (declarative) |
| `use[Domain]Manager` | `useItemManager` | Mutations (imperative)          |
| `use[Domain]Search`  | `useItemSearch`  | Search/filter/pagination        |

### Methods

| Verb             | Usage             | Example           |
| ---------------- | ----------------- | ----------------- |
| `fetch...Api`    | GET request       | `fetchItemApi`    |
| `create...Api`   | POST request      | `createItemApi`   |
| `update...Api`   | PATCH/PUT request | `updateItemApi`   |
| `delete...Api`   | DELETE request    | `deleteItemApi`   |
| `get...Async`    | Imperative GET    | `getItemAsync`    |
| `update...Async` | Imperative UPDATE | `updateItemAsync` |
| `delete...Async` | Imperative DELETE | `deleteItemAsync` |

### State Variables

| Pattern                 | Example           | Meaning                  |
| ----------------------- | ----------------- | ------------------------ |
| `is[Action][Domain]`    | `isLoadingItem`   | Loading state            |
| `[domain]Error`         | `itemError`       | Error state              |
| `[domain][Action]Error` | `itemUpdateError` | Specific operation error |

---

## Decision Tree

```
Do you need to DISPLAY data?
├─ YES → Use useQuery (declarative)
│   └─ Create use[Domain]Detail hook
│
└─ NO → Is this a USER ACTION?
    ├─ YES → Use useMutation (imperative)
    │   └─ Use use[Domain]Manager hook
    │
    └─ NO → Is this SEARCH/FILTER?
        └─ YES → Use useQuery + useState (declarative with params)
            └─ Create use[Domain]Search hook
```

---

## Key Takeaways

1. **Declarative (`useQuery`)** = Data loads automatically, stays in sync
2. **Imperative (`useMutation`)** = Data changes only when user acts
3. **Domain-specific naming** = Clear what each variable represents
4. **Separation of concerns** = API layer, query layer, mutation layer, component layer
5. **No cache manipulation** = Cache is disabled, you manage state yourself
