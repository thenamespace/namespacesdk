# Runtime contracts

## SIWE v4

- Use the repository's v4 SIWE request/response schema and endpoint contract; do not infer field names from an older SDK version.
- Bind the signed message to the resolved chain ID and intended domain/URI.
- Obtain a fresh nonce through the supported flow and preserve server-required statement, resources, time fields, and request identifiers.
- Request a signature only after validating the provider chain.
- Send authentication material only in the required fields or headers and only to the configured trusted API origin.
- Classify authentication rejection, wallet rejection, transport failure, and invalid server response without exposing the message or signature.

Before changing the flow, locate the v4 types, endpoint paths, fixtures, and tests in the repository. Prefer those artifacts over assumptions or external examples.

## Chain handling

Use this decision table:

| Input | Target | Required provider behavior |
|---|---:|---|
| Chain omitted | Ethereum mainnet (`1`) | Validate or switch to `1` |
| Mainnet explicit | Ethereum mainnet (`1`) | Validate or switch to `1` |
| Sepolia explicit | Sepolia (`11155111`) | Validate or switch to `11155111` |
| Unsupported chain | None | Fail before signing or API access |

Normalize hexadecimal and numeric provider chain IDs before comparison. For EIP-1193 providers:

1. Read `eth_chainId`.
2. If mismatched, request `wallet_switchEthereumChain` with a hexadecimal chain ID.
3. Read `eth_chainId` again.
4. Continue only when it equals the target.

Do not automatically add a network unless the package contract explicitly supports and tests that behavior. Preserve the original provider error as a safe cause or code only when it contains no credentials.

## Route and response normalization

Use the endpoint and output mapping:

| Asset | Route | Canonical output | Legacy input fallback |
|---|---|---|---|
| Avatar | `/avatar` | `avatarUrl` | `url` |
| Header | `/h` | `headerUrl` | `url` |

Prefer the canonical server field when both canonical and legacy fields exist. Validate that the selected value has the type required by the public SDK contract. Return a stable malformed-response error instead of propagating a raw body. Do not reintroduce `url` as the canonical public result; retain it only where existing compatibility promises require it.

## Safe errors

Convert thrown values into a small allowlist of public fields, such as a stable error name/code, safe message, HTTP status, and a recursively sanitized cause when appropriate. Replace sensitive values with a redaction marker. Treat these keys and close variants as sensitive:

- `message` when it contains the SIWE message rather than an error description
- `signature`, `siwe`, `authorization`, `cookie`, `token`, `secret`, `privateKey`
- authentication request bodies, headers, and provider/request objects

Do not rely only on key-name redaction. Avoid attaching raw Axios/fetch errors, request configs, response bodies, wallet provider objects, or arbitrary thrown objects. Test that known nonce/message/signature fixtures do not occur in serialized errors, logs, snapshots, or PR output.
