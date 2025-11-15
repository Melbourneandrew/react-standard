# React Standards - Canonical Example

A complete, production-ready implementation of the React architecture patterns used in modern applications. This project demonstrates the proper layered approach to building scalable React applications with Next.js and React Query.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📖 Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Setup guide and feature walkthrough
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete technical implementation details
- **[scratch/](./scratch/)** - Original canonical examples and architecture documentation
  - [README.md](./scratch/README.md) - Architecture overview
  - [ARCHITECTURE.md](./scratch/ARCHITECTURE.md) - Detailed architecture diagrams
  - [QUICK_REFERENCE.md](./scratch/QUICK_REFERENCE.md) - Code templates and patterns
  - [IMPERATIVE_VS_DECLARATIVE.md](./scratch/IMPERATIVE_VS_DECLARATIVE.md) - Data fetching patterns

## 🏗️ Architecture

This project implements a 5-layer architecture:

```
┌─────────────────────────────────────┐
│     Components (UI Layer)           │  ← ItemsList.tsx, ItemDetail.tsx
├─────────────────────────────────────┤
│     Context (State Aggregation)     │  ← ItemContext.tsx
├─────────────────────────────────────┤
│     Manager Hooks (Business Logic)  │  ← useItemManager, useItemSearch, useItemSelection
├─────────────────────────────────────┤
│     API Hooks (Data Access)         │  ← useItemsApi
├─────────────────────────────────────┤
│     Types (Data Models)             │  ← item.ts
└─────────────────────────────────────┘
```

### Data Flow

```
User Action → Component → Context → Manager Hook → API Hook → API Route → Manager Hook (cache update) → Component (re-render)
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/items/              # Mock API routes
│   │   ├── search/route.ts     # Search endpoint
│   │   └── [id]/route.ts       # CRUD endpoints
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Main demo page
├── components/
│   ├── ItemDetail.tsx          # Imperative fetching example
│   └── ItemsList.tsx           # Declarative fetching example
├── contexts/
│   └── ItemContext.tsx         # State aggregation
├── hooks/
│   ├── api/
│   │   └── useItemsApi.ts     # API access layer
│   ├── useItemManager.ts       # CRUD operations
│   ├── useItemSearch.ts        # Search & pagination
│   ├── useItemSelection.ts     # Selection state
│   └── use-api.ts              # HTTP client
├── providers/
│   └── QueryProvider.tsx       # React Query setup
└── types/
    └── item.ts                 # TypeScript types
```

## ✨ Features

### Implemented

- ✅ **Search & Filter** - Full-text search and status filtering
- ✅ **Pagination** - Page navigation with controls
- ✅ **Item Selection** - Click to select with keyboard navigation
- ✅ **CRUD Operations** - Update and delete with optimistic updates
- ✅ **Loading States** - Proper loading indicators
- ✅ **Error Handling** - Error boundaries and messages
- ✅ **Mock API** - Fully functional API routes
- ✅ **TypeScript** - Complete type safety
- ✅ **React Query** - Advanced caching and state management
- ✅ **Responsive Design** - Mobile-friendly layout

### Patterns Demonstrated

- ✅ Declarative data fetching (useQuery)
- ✅ Imperative data fetching (fetchQuery)
- ✅ Mutations with optimistic updates
- ✅ Cache invalidation strategies
- ✅ Hook composition
- ✅ Context aggregation
- ✅ Manager hooks pattern
- ✅ Object destructuring everywhere
- ✅ Proper TypeScript typing

## 🎯 Key Concepts

### 1. API Hooks (Repository Layer)

Pure API access functions that return typed promises:

```typescript
const { fetchItem, updateItem } = useItemsApi();
const item = await fetchItem("123"); // Promise<Item>
```

### 2. Manager Hooks (Service Layer)

Business logic and state management with React Query:

```typescript
const { items, isLoading, updateItem } = useItemManager();
// State managed by React Query
```

### 3. Context (State Sharing)

Aggregates multiple manager hooks for component access:

```typescript
const { items, selectedItem, updateItem } = useItemContext();
// Everything in one place
```

### 4. Components (Presentation)

UI rendering with context consumption:

```typescript
function ItemsList() {
  const { items, isLoading } = useItemContext();
  // Just render
}
```

## 🔧 Technologies

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[React Query](https://tanstack.com/query)** - Data fetching and caching
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling

## 📚 Learning Path

1. **Start Here**: Open [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Explore**: Try the features at http://localhost:3000
3. **Read Code**: Start with `src/types/item.ts` and work your way up
4. **Understand**: Review [scratch/ARCHITECTURE.md](./scratch/ARCHITECTURE.md)
5. **Practice**: Modify something and see what breaks
6. **Build**: Create your own feature following the patterns

## 🧪 API Endpoints

All endpoints are fully functional mock APIs:

### Search Items

```bash
GET /api/items/search?project_id=project-123&query=test&status=active&page=1
```

### Get Single Item

```bash
GET /api/items/1
```

### Update Item

```bash
PATCH /api/items/1
Content-Type: application/json
{"name": "Updated Name"}
```

### Delete Item

```bash
DELETE /api/items/1
```

## 🎨 Code Quality

- ✅ No TypeScript errors
- ✅ No linter errors
- ✅ Consistent naming conventions
- ✅ Comprehensive comments
- ✅ Type-safe throughout
- ✅ Follows React best practices
- ✅ Production-ready patterns

## 💡 Use Cases

This pattern is perfect for:

- ✅ Complex CRUD applications
- ✅ Data-heavy dashboards
- ✅ Admin panels
- ✅ Search & filter interfaces
- ✅ Real-time data applications
- ✅ Forms with server state
- ✅ List/detail views
- ✅ Multi-step workflows

## 🤝 Contributing

This is a reference implementation. Feel free to:

- Clone and modify for your projects
- Use as a template for new features
- Share with your team as a standard
- Extend with additional patterns

## 📄 License

This is an educational example project.

## 🙏 Acknowledgments

Based on the SF Platform React architecture patterns. Special thanks to the team for developing these comprehensive standards.

---

**Built with ❤️ to demonstrate production-ready React patterns**

For questions or feedback, refer to the documentation in the `scratch/` directory or the implementation summaries.
