# Offchain Manager SDK - Error Handling

## Error Classes

All errors extend `NamespaceSDKError`:

```typescript
import {
  NamespaceSDKError,
  AuthenticationError,
  ValidationError,
  SubnameNotFoundError,
  SubnameAlreadyExistsError,
  RateLimitError,
} from '@thenamespace/offchain-manager';
```

| Error                      | Code                 | When                          |
|----------------------------|----------------------|-------------------------------|
| `AuthenticationError`      | `AUTH_ERROR`         | Invalid or missing API key    |
| `ValidationError`          | `VALIDATION_ERROR`   | Invalid request parameters    |
| `SubnameNotFoundError`     | `SUBDOMAIN_NOT_FOUND`| Subname doesn't exist         |
| `SubnameAlreadyExistsError`| `SUBDOMAIN_EXISTS`   | Subname already registered    |
| `RateLimitError`           | `RATE_LIMIT`         | Too many requests             |

## Base Class

```typescript
class NamespaceSDKError extends Error {
  readonly code?: string;  // programmatic error code
}
```

## Usage

```typescript
try {
  await client.createSubname({ parentName: 'example.eth', label: 'alice' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid API key — get one at https://dev.namespace.ninja
  } else if (error instanceof SubnameAlreadyExistsError) {
    // Already registered — try a different label
  } else if (error instanceof ValidationError) {
    // Bad parameters — check error.message for details
  } else if (error instanceof RateLimitError) {
    // Back off and retry
  } else if (error instanceof NamespaceSDKError) {
    // Other SDK error — check error.code and error.message
  }
}
```

## Common Scenarios

**Missing API key**: Throws `Error` (not `AuthenticationError`) with message including "Api key is not present for name". Call `setDefaultApiKey()` or `setApiKey()` before operations.

**Subname not found on `getSingleSubname`**: Returns `null` instead of throwing. Other methods that operate on existing subnames (update, add/delete records) will throw if the subname doesn't exist.
