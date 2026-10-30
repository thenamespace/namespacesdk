import {
  CreateUsernameOwnerSessionOptions,
  ExpectedRevisionRequest,
  ParentInspection,
  RotateUsernameCredentialRequest,
  SaveUsernameConnectionRequest,
  UsernameConnection,
  UsernameConnectionEvent,
  UsernameOwnerSession,
  UsernameValidationReport,
  ValidateUsernameEndpointRequest,
} from "./types";
import { UsernameOwnerWallet } from "./wallet-adapters";

/**
 * Universal Usernames: serve `username.<parentName>` from the brand's own HTTPS endpoint.
 * Only the exact owner of the parent name can configure it; API keys are not accepted.
 *
 * Pass the owner's wallet as `provider` in `createOffchainClient`. Reads use a sign-in session
 * that the client creates on first use and keeps in memory until it expires. Every change asks
 * the wallet to sign that one change with a fresh server nonce.
 * You can also pass a session to a read, or a wallet to a change, to override the defaults.
 *
 * `parentName` is the normalized second-level `.eth` name, e.g. `brand.eth`.
 * Failed requests throw `UniversalUsernamesError` or one of its subclasses
 * (`NotParentOwnerError`, `ConnectionRevisionConflictError`, `EndpointValidationError`).
 */
export interface UsernameConnectionMethods {
  /**
   * Sign in with the parent owner's wallet. The token works like a password for this address
   * on offchain-manager until it expires: keep it in memory and never log it.
   * You only need this to manage sessions yourself; reads create one when you don't pass it.
   */
  createUsernameOwnerSession(
    options?: CreateUsernameOwnerSessionOptions
  ): Promise<UsernameOwnerSession>;

  /**
   * Get the parent's connection: status, revisions and the last validation. Never the credential.
   * @returns The connection, or null when the parent has none
   */
  getUsernameConnection(
    parentName: string,
    session?: UsernameOwnerSession
  ): Promise<UsernameConnection | null>;

  /** Check whether the parent can be connected: owner, resolver, route, stored subnames and blockers. */
  inspectUsernameParent(
    parentName: string,
    session?: UsernameOwnerSession
  ): Promise<ParentInspection>;

  /**
   * Dry run: call the endpoint for one username and report every issue. Nothing is stored.
   * A report with `ok: false` is a normal answer, not an error.
   * @example
   * ```typescript
   * const report = await client.validateUsernameEndpoint("brand.eth", {
   *   endpointUrl: "https://api.brand.example/ens/users",
   *   authMode: "none",
   *   username: "happy",
   * });
   * ```
   */
  validateUsernameEndpoint(
    parentName: string,
    request: ValidateUsernameEndpointRequest,
    session?: UsernameOwnerSession
  ): Promise<UsernameValidationReport>;

  /**
   * Save the endpoint as a new revision and validate it. While a connection is active this
   * creates a candidate; call `activateUsernameConnection` to switch to it.
   * @throws {ConnectionRevisionConflictError} When `expectedRevision` is stale
   */
  saveUsernameConnection(
    parentName: string,
    request: SaveUsernameConnectionRequest,
    wallet?: UsernameOwnerWallet
  ): Promise<UsernameConnection>;

  /**
   * Start serving the validated revision. The API checks the resolver, route and a live lookup;
   * when they fail the connection goes back to `validated` with `activation.errors`.
   */
  activateUsernameConnection(
    parentName: string,
    request: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ): Promise<UsernameConnection>;

  /** Validate one username against the serving (or latest) revision. */
  previewUsername(
    parentName: string,
    username: string,
    session?: UsernameOwnerSession
  ): Promise<UsernameValidationReport>;

  /**
   * Validate a new bearer token and switch to it. On an active connection the new token is
   * promoted straight away; don't call `activateUsernameConnection` afterwards.
   */
  rotateUsernameCredential(
    parentName: string,
    request: RotateUsernameCredentialRequest,
    wallet?: UsernameOwnerWallet
  ): Promise<UsernameConnection>;

  /** Stop serving: lookups return an error until resumed. */
  pauseUsernameConnection(
    parentName: string,
    request: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ): Promise<UsernameConnection>;

  /** Serve again after a pause, once the setup and sample username check out. */
  resumeUsernameConnection(
    parentName: string,
    request: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ): Promise<UsernameConnection>;

  /** End the connection for good. Credentials are wiped; history is kept. */
  disconnectUsernameConnection(
    parentName: string,
    request: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ): Promise<UsernameConnection>;

  /** The connection's audit log. Details are redacted by the API. */
  getUsernameConnectionEvents(
    parentName: string,
    session?: UsernameOwnerSession
  ): Promise<UsernameConnectionEvent[]>;
}
