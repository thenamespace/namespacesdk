import { AxiosInstance } from "axios";

interface AuthTokenClaims {
  address: string;
  nonce: string;
  issued: number;
}

export type SignerFunction = (message: string) => Promise<string>;

export const _generateApiKeyForName = async (
  client: AxiosInstance,
  ensName: string,
  signerAddress: string,
  signerFunc: SignerFunction
): Promise<string> => {
  const token = await generateToken(client, signerAddress, signerFunc);
  const { data } = await client.post<{ apiKey: string }>(
    `/auth/name/${ensName}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data.apiKey;
};

export const _nonce = async (client: AxiosInstance): Promise<string> => {
  return client.get<string>("/auth/nonce").then((res) => res.data);
};

const generateToken = async (
  client: AxiosInstance,
  signerWallet: string,
  signerFunc: SignerFunction
) => {
  const nonce = await _nonce(client);
  const claims: AuthTokenClaims = {
    address: signerWallet,
    issued: new Date().getTime(),
    nonce,
  };
  const claimsJSON = JSON.stringify(claims);
  const claimsB64 = btoa(claimsJSON);
  const signature = await signerFunc(claimsJSON);
  const signatureB64 = btoa(signature);

  return `${claimsB64}.${signatureB64}`;
};
