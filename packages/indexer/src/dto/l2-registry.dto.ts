export interface L2RegistryResponse {
    name: string
    owner: string
    tokenSymbol: string
    tokenName: string
    tokenAddress: string
    is_expirable: boolean
    is_burnable: boolean
    chain_id: number
}