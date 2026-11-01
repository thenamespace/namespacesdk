import { parseAbi } from "viem";
export { ActivationManagerAbi as activationManagerAbi } from "./abi/ActivationManagerAbi.js";
export { SubnameIssuerAbi as subnameIssuerAbi } from "./abi/SubnameIssuerAbi.js";
export { WhitelistFeatureAbi as whitelistAbi } from "./abi/WhitelistFeatureAbi.js";
export { ReservationFeatureAbi as reservationAbi } from "./abi/ReservationFeatureAbi.js";

// Mirrors IENSv2Registry and IENSv2RootRoles in onchain-subnames.
export const registryAbi = parseAbi([
  "function getStatus(uint256 anyId) view returns (uint8)",
  "function getOwner(uint256 anyId) view returns (address)",
  "function getExpiry(uint256 anyId) view returns (uint64)",
  "function getSubregistry(string label) view returns (address)",
  "function hasRoles(uint256 anyId, uint256 roleBitmap, address account) view returns (bool)",
  "function hasRootRoles(uint256 roleBitmap, address account) view returns (bool)",
]);
export const erc20Abi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);
