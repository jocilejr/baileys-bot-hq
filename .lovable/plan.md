

## Fix: TypeScript errors in server/src/routes/instances.ts

The `req.params.id` type in Express 5 is `string | string[]`. Need to cast it to `string` in 3 places.

### Changes to `server/src/routes/instances.ts`

Lines 42-43, 53-54, 62-63: Change `const { id } = req.params;` to extract and cast:

```typescript
const id = req.params.id as string;
```

All 3 occurrences (delete, reconnect, status endpoints).

