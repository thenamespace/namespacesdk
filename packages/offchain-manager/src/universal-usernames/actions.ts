import { AxiosInstance, AxiosRequestConfig } from "axios";
import { AUTH_HEADER } from "../offchain-client/private-actions";
import { toUniversalUsernamesError, UniversalUsernamesError } from "./errors";
import {
  ParentInspection,
  RotateUsernameCredentialRequest,
  SaveUsernameConnectionRequest,
  UsernameConnection,
  UsernameConnectionEvent,
  UsernameValidationReport,
  ValidateUsernameEndpointRequest,
} from "./types";

const connectionPath = (parentName: string, suffix = "") =>
  `/api/v1/universal-usernames/${encodeURIComponent(parentName)}${suffix}`;

// `authHeader` is a session token or an operation signature; it replaces any API key header
const send = async <T>(
  http: AxiosInstance,
  authHeader: string,
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const res = await http.request<T>({
      ...config,
      headers: { [AUTH_HEADER]: authHeader },
    });
    return res.data;
  } catch (err) {
    throw toUniversalUsernamesError(err);
  }
};

/** A fresh single-use nonce for an operation signature. */
export const _fetchOperationNonce = async (
  http: AxiosInstance
): Promise<string> => {
  let nonce: unknown;
  try {
    // As text: the route answers with a bare string that JSON parsing could turn into a number
    const res = await http.get("/api/v1/auth/nonce", { responseType: "text" });
    nonce = res.data;
  } catch (err) {
    throw toUniversalUsernamesError(err);
  }
  if (typeof nonce !== "string" || !/^[a-zA-Z0-9]{8,}$/.test(nonce)) {
    throw new UniversalUsernamesError(
      "offchain-manager returned an invalid nonce",
      undefined,
      undefined
    );
  }
  return nonce;
};

export const _getUsernameConnection = async (
  http: AxiosInstance,
  authHeader: string,
  parentName: string
): Promise<UsernameConnection | null> => {
  try {
    return await send<UsernameConnection>(http, authHeader, {
      method: "GET",
      url: connectionPath(parentName),
    });
  } catch (err) {
    // Only the API's own answer means "no connection"; a bare 404 (feature off) still throws
    if (
      err instanceof UniversalUsernamesError &&
      err.code === "CONNECTION_NOT_FOUND"
    ) {
      return null;
    }
    throw err;
  }
};

export const _inspectUsernameParent = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string
) =>
  send<ParentInspection>(http, authHeader, {
    method: "GET",
    url: connectionPath(parentName, "/inspection"),
  });

export const _validateUsernameEndpoint = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string,
  request: ValidateUsernameEndpointRequest
) =>
  send<UsernameValidationReport>(http, authHeader, {
    method: "POST",
    url: connectionPath(parentName, "/validate"),
    data: request,
  });

export const _saveUsernameConnection = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string,
  request: SaveUsernameConnectionRequest
) =>
  send<UsernameConnection>(http, authHeader, {
    method: "PUT",
    url: connectionPath(parentName),
    data: request,
  });

export const _previewUsername = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string,
  username: string
) =>
  send<UsernameValidationReport>(http, authHeader, {
    method: "POST",
    url: connectionPath(parentName, "/preview"),
    data: { username },
  });

export const _rotateUsernameCredential = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string,
  request: RotateUsernameCredentialRequest
) =>
  send<UsernameConnection>(http, authHeader, {
    method: "POST",
    url: connectionPath(parentName, "/credential"),
    data: request,
  });

/** activate, pause and resume: a POST with only `expectedRevision` in the body. */
export const _transitionUsernameConnection = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string,
  transition: "activate" | "pause" | "resume",
  expectedRevision: number
) =>
  send<UsernameConnection>(http, authHeader, {
    method: "POST",
    url: connectionPath(parentName, `/${transition}`),
    data: { expectedRevision },
  });

export const _disconnectUsernameConnection = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string,
  expectedRevision: number
) =>
  send<UsernameConnection>(http, authHeader, {
    method: "DELETE",
    url: connectionPath(parentName),
    params: { expectedRevision },
  });

export const _getUsernameConnectionEvents = (
  http: AxiosInstance,
  authHeader: string,
  parentName: string
) =>
  send<UsernameConnectionEvent[]>(http, authHeader, {
    method: "GET",
    url: connectionPath(parentName, "/events"),
  });
