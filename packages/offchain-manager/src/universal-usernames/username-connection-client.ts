import { AxiosInstance } from "axios";
import { ValidationError } from "../offchain-client/errors";
import {
  _disconnectUsernameConnection,
  _fetchOperationNonce,
  _getUsernameConnection,
  _getUsernameConnectionEvents,
  _inspectUsernameParent,
  _previewUsername,
  _rotateUsernameCredential,
  _saveUsernameConnection,
  _transitionUsernameConnection,
  _validateUsernameEndpoint,
} from "./actions";
import { UsernameConnectionMethods } from "./client-methods";
import {
  createOwnerSession,
  SiweSigningContext,
  signOperation,
  siweAuthHeader,
} from "./owner-auth";
import {
  CreateUsernameOwnerSessionOptions,
  ExpectedRevisionRequest,
  RotateUsernameCredentialRequest,
  SaveUsernameConnectionRequest,
  UsernameOperation,
  UsernameOwnerSession,
  ValidateUsernameEndpointRequest,
} from "./types";
import {
  adaptWallet,
  UsernameOwnerWallet,
  WalletProvider,
} from "./wallet-adapters";

// A cached session is signed again when less than this is left, so a request in flight can't outlive it
const SESSION_RENEW_MARGIN_MS = 60 * 1000;

const CHAIN_IDS = { mainnet: 1, sepolia: 11155111 } as const;

export interface UsernameConnectionSettings {
  mode: keyof typeof CHAIN_IDS;
  /** The offchain-manager URL the client talks to. */
  backendUri: string;
  provider?: UsernameOwnerWallet;
  siweDomain?: string;
  siweUri?: string;
}

/** The Universal Usernames methods of the offchain client. */
export class UsernameConnectionClient implements UsernameConnectionMethods {
  // The session reads use when none is passed. Only ever held in memory.
  private ownerSession?: {
    address: string;
    session: Promise<UsernameOwnerSession>;
  };

  constructor(
    private readonly http: AxiosInstance,
    private readonly settings: UsernameConnectionSettings
  ) {}

  public async createUsernameOwnerSession(
    options: CreateUsernameOwnerSessionOptions = {}
  ) {
    return createOwnerSession(
      this.ownerWallet(options.wallet),
      this.siweContext(),
      options.expiresInSeconds
    );
  }

  public async getUsernameConnection(
    parentName: string,
    session?: UsernameOwnerSession
  ) {
    const authHeader = await this.sessionHeader(session);
    return _getUsernameConnection(this.http, authHeader, parentName);
  }

  public async inspectUsernameParent(
    parentName: string,
    session?: UsernameOwnerSession
  ) {
    const authHeader = await this.sessionHeader(session);
    return _inspectUsernameParent(this.http, authHeader, parentName);
  }

  public async validateUsernameEndpoint(
    parentName: string,
    request: ValidateUsernameEndpointRequest,
    session?: UsernameOwnerSession
  ) {
    const authHeader = await this.sessionHeader(session);
    return _validateUsernameEndpoint(this.http, authHeader, parentName, request);
  }

  public async saveUsernameConnection(
    parentName: string,
    request: SaveUsernameConnectionRequest,
    wallet?: UsernameOwnerWallet
  ) {
    const authHeader = await this.authorizeOperation(
      parentName,
      "save",
      request.expectedRevision,
      wallet
    );
    return _saveUsernameConnection(this.http, authHeader, parentName, request);
  }

  public async activateUsernameConnection(
    parentName: string,
    { expectedRevision }: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ) {
    const authHeader = await this.authorizeOperation(
      parentName,
      "activate",
      expectedRevision,
      wallet
    );
    return _transitionUsernameConnection(
      this.http,
      authHeader,
      parentName,
      "activate",
      expectedRevision
    );
  }

  public async previewUsername(
    parentName: string,
    username: string,
    session?: UsernameOwnerSession
  ) {
    const authHeader = await this.sessionHeader(session);
    return _previewUsername(this.http, authHeader, parentName, username);
  }

  public async rotateUsernameCredential(
    parentName: string,
    request: RotateUsernameCredentialRequest,
    wallet?: UsernameOwnerWallet
  ) {
    const authHeader = await this.authorizeOperation(
      parentName,
      "rotate-credential",
      request.expectedRevision,
      wallet
    );
    return _rotateUsernameCredential(this.http, authHeader, parentName, request);
  }

  public async pauseUsernameConnection(
    parentName: string,
    { expectedRevision }: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ) {
    const authHeader = await this.authorizeOperation(
      parentName,
      "pause",
      expectedRevision,
      wallet
    );
    return _transitionUsernameConnection(
      this.http,
      authHeader,
      parentName,
      "pause",
      expectedRevision
    );
  }

  public async resumeUsernameConnection(
    parentName: string,
    { expectedRevision }: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ) {
    const authHeader = await this.authorizeOperation(
      parentName,
      "resume",
      expectedRevision,
      wallet
    );
    return _transitionUsernameConnection(
      this.http,
      authHeader,
      parentName,
      "resume",
      expectedRevision
    );
  }

  public async disconnectUsernameConnection(
    parentName: string,
    { expectedRevision }: ExpectedRevisionRequest,
    wallet?: UsernameOwnerWallet
  ) {
    const authHeader = await this.authorizeOperation(
      parentName,
      "disconnect",
      expectedRevision,
      wallet
    );
    return _disconnectUsernameConnection(
      this.http,
      authHeader,
      parentName,
      expectedRevision
    );
  }

  public async getUsernameConnectionEvents(
    parentName: string,
    session?: UsernameOwnerSession
  ) {
    const authHeader = await this.sessionHeader(session);
    return _getUsernameConnectionEvents(this.http, authHeader, parentName);
  }

  // Defaults to the offchain-manager host, which the API accepts as a SIWE domain
  private siweContext(): SiweSigningContext {
    const domain =
      this.settings.siweDomain || new URL(this.settings.backendUri).host;
    return {
      domain,
      uri: this.settings.siweUri || `https://${domain}`,
      chainId: CHAIN_IDS[this.settings.mode],
    };
  }

  private ownerWallet(wallet?: UsernameOwnerWallet): WalletProvider {
    const selected = wallet ?? this.settings.provider;
    if (!selected) {
      throw new ValidationError(
        "Universal Usernames need the parent owner's wallet: set `provider` in createOffchainClient() or pass a wallet"
      );
    }
    return adaptWallet(selected);
  }

  private authorizeOperation(
    parentName: string,
    action: UsernameOperation,
    expectedRevision: number,
    wallet?: UsernameOwnerWallet
  ) {
    return signOperation(
      this.ownerWallet(wallet),
      this.siweContext(),
      { parentName, action, expectedRevision },
      () => _fetchOperationNonce(this.http)
    );
  }

  private async sessionHeader(session?: UsernameOwnerSession) {
    return siweAuthHeader((session ?? (await this.defaultSession())).token);
  }

  // One sign-in shared by concurrent reads, signed again when it nears expiry or the wallet
  // switched accounts
  private async defaultSession(): Promise<UsernameOwnerSession> {
    const wallet = this.ownerWallet();
    const address = (await wallet.getAddress()).toLowerCase();

    const cached = this.ownerSession;
    if (cached?.address === address) {
      // A rejected sign-in rejects every read that was waiting for it
      const session = await cached.session;
      if (session.expiresAt - Date.now() > SESSION_RENEW_MARGIN_MS) {
        return session;
      }
      // Another read may have started a new sign-in while this one waited
      if (this.ownerSession !== cached) {
        return this.defaultSession();
      }
    }

    const entry = {
      address,
      session: createOwnerSession(wallet, this.siweContext()),
    };
    this.ownerSession = entry;
    // Forget a failed sign-in so the next read asks again; the caller still gets the error
    entry.session.catch(() => {
      if (this.ownerSession === entry) {
        this.ownerSession = undefined;
      }
    });
    return entry.session;
  }
}
