# Offchain Manager SDK - Advanced Patterns

## Contents

- Domain-specific API keys
- Set default EVM address
- Metadata for filtering
- Pagination
- Update and delete patterns
- Validation utilities
- ENS client compatibility

## Domain-Specific API Keys

Manage multiple domains with separate keys:

```typescript
const client = createOffchainClient({
  mode: 'mainnet',
  defaultApiKey: 'fallback-key',
  domainApiKeys: {
    'project1.eth': 'key-for-project1',
    'project2.eth': 'key-for-project2',
  }
});

client.setApiKey('project3.eth', 'key-for-project3');
```

Resolution priority: domain-specific key → default key. Throws if neither is set.

## Set Default EVM Address

Set one address across all 19 EVM chains in a single call:

```typescript
await client.setDefaultEvmAddress('alice.example.eth', '0x...');
```

Covers: Default, Ethereum, Arbitrum, Optimism, Base, Polygon, BSC, Avalanche, Gnosis, zkSync, Linea, Scroll, Unichain, Berachain, WorldChain, Zora, Celo, Monad, Push.

Replaces 19 individual `addAddressRecord` calls.

## Metadata for Filtering

Metadata records are not resolved onchain but enable server-side filtering:

```typescript
await client.createSubname({
  label: 'alice',
  parentName: 'example.eth',
  metadata: [
    { key: 'tier', value: 'premium' },
    { key: 'role', value: 'dev' },
  ],
});

const results = await client.getFilteredSubnames({
  parentName: 'example.eth',
  metadata: { tier: 'premium' },
});
```

Do not store sensitive information — metadata is readable by anyone with API access.

## Pagination

```typescript
async function* getAllSubnames(
  client: ReturnType<typeof createOffchainClient>,
  parentName: string,
) {
  let page = 1;
  const size = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await client.getFilteredSubnames({ parentName, page, size });
    for (const item of response.items) yield item;
    hasMore = page * size < response.totalItems;
    page++;
  }
}

for await (const subname of getAllSubnames(client, 'example.eth')) {
  console.log(subname.fullName);
}
```

## Update and Delete

### Update records

```typescript
await client.updateSubname('alice.example.eth', {
  texts: [{ key: 'url', value: 'https://new-site.com' }],
  addresses: [{ chain: ChainName.Base, value: '0xnew...' }],
  ttl: 3600,
});
```

`updateSubname` does not support changing `owner`. Delete and recreate to change ownership.

### Delete subname

Deletion is irreversible. All text records, address records, metadata, and contenthash are removed.

```typescript
await client.deleteSubname('alice.example.eth');
```

### Individual record operations

```typescript
// Address records
await client.addAddressRecord('alice.example.eth', ChainName.Solana, 'SOL_ADDR...');
await client.deleteAddressRecord('alice.example.eth', ChainName.Solana);

// Text records
await client.addTextRecord('alice.example.eth', 'com.twitter', 'alice');
await client.deleteTextRecord('alice.example.eth', 'com.twitter');

// Metadata records
await client.addDataRecord('alice.example.eth', 'score', '1200');
await client.deleteDataRecord('alice.example.eth', 'score');
```

## Validation Utilities

```typescript
import {
  validateEnsName,
  validateSubname,
  validateAddress,
  validateApiKey,
  ChainName,
} from '@thenamespace/offchain-manager';

validateEnsName('example.eth');                       // ✅
validateEnsName('mysite.com');                        // ✅ imported domains
validateSubname('alice.example.eth');                 // ✅
validateAddress('0x...', ChainName.Ethereum);         // ✅
validateApiKey('ns-abc-123...');                      // ✅
```

All throw `ValidationError` on invalid input.

Supported address formats:

| Chain               | Format                                          |
|---------------------|-------------------------------------------------|
| EVM chains          | `0x` + 40 hex characters                        |
| Solana              | Base58, 32-44 characters                        |
| Bitcoin             | Legacy, Script, Bech32, Taproot                 |
| Cosmos              | Bech32 with `cosmos1` prefix                    |
| NEAR                | 64 hex chars (implicit) or `*.near` (named)     |
| Sui / Aptos / Stark | `0x` + 1-64 hex characters                      |
| Algorand            | Base32, 58 characters                           |

## ENS Client Compatibility

Offchain subnames resolve via standard ENS libraries: [wagmi](https://wagmi.sh/), [viem](https://viem.sh/), [ethers](https://docs.ethers.org/v6/).

**Reverse resolution is NOT supported** for offchain subnames. You cannot look up a name from an address using ENS reverse resolution.

Workaround: use the `owner` field when creating subnames, then query via `getFilteredSubnames({ parentName, owner })` for address→name lookups. Recommend one address per one subname for clean reverse mapping.
