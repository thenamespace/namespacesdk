type Address = `0x${string}`

const mainnetId = 1;
const sepoliaId = 11155111;
const baseId = 8453;
const baseSepoliaId = 84532;
const opId = 10;

export interface L1ContractAddresses {
    mintController: Address
    nameWrapperProxy: Address
    hybridResolver: Address
    oldHybridResolver: Address
    hybridResolverV2: Address
    bulkEnsRegistrar: Address
}

export interface L2ContractAddresses {
    controller: Address;
    resolver: Address;
    registryResolver: Address;
    emitter: Address;
}

export interface EnsContracts {
    nameWrapper: Address
    ensRegistry: Address
    publicResolver: Address
    ethRegistrarController: Address
    universalResolver: Address
    unwrappedRegistrarController: Address
    baseRegistrar: Address
}

export interface PaymentToken {
    symbol: string
    address: Address
    decimals: number
}

export interface EnsV2Contracts {
    rootRegistry: Address
    ethRegistry: Address
    ethRegistrar: Address
    // Renews premigrated ENSv1 names still reserved on ENSv2
    ethRenewerV1: Address
    verifiableFactory: Address
    userRegistryImpl: Address
    permissionedResolverImpl: Address
    universalResolver: Address
    // Tokens the ETHRegistrar accepts for registration and renewal
    paymentTokens: PaymentToken[]
}

export interface NamespaceV2FeatureModules {
    labelPrices: Address
    specialPrices: Address
    whitelist: Address
    deadline: Address
    reservation: Address
    tokenGate: Address
}

export interface NamespaceV2Contracts {
    activationManager: Address
    subnameIssuer: Address
    sharedResolver: Address
    splitPaymentModule: Address
    features: NamespaceV2FeatureModules
    // Tokens subnames can be minted with
    paymentTokens: PaymentToken[]
}

const l1Contracts: Record<number, L1ContractAddresses> = {
    [mainnetId]: {
        mintController: "0xCf7625A2fb60B0822444E5964b4Ce80c148e7Fad",
        nameWrapperProxy: "0x25ADB7e69390FbfeEe26F3C8053955d4D4428Afd",
        hybridResolver: "0xe5A0277018879679d18cCDb66B52BD06f7fE95FD",
        oldHybridResolver: "0x0dcD506D1Be162E50A2b434028A9a148F2686444",
        hybridResolverV2: "0x0A67542cbD8d71CB760d1EeB5a4b4a77ea35Ff9b",
        bulkEnsRegistrar: "0x99393f6ceb39a6fdefdfeed1606669b16c49c453",
    },
    [sepoliaId]: {
        mintController: "0x313442ba3A0b12193787BD162f99Ed3C415F2886",
        nameWrapperProxy: "0x0Ff41b99D7185B01bA47Ca85e9049166Cb3CD6bd",
        hybridResolver: "0xd5568c739f3a615c27e8926f1067b9a791893c3e",
        oldHybridResolver: "0x2F5E9E8B4495e4CDC5bC6C5FCBa93B8AaBDeF595",
        hybridResolverV2: "0x976a3E43b2a6706F52D9555931c68eb62D134ff7",
        bulkEnsRegistrar: "0x94df1d05e6f1e064c586cee6be8b94eeaacc14aa"
    }
}

const l2Contracts: Record<number, L2ContractAddresses> = {
    [baseId]: {
        controller: "0xa8e61891626f86ae6397217823701183de947c7d",
        emitter: "0xA9EA3fbBDB2d1696dC67C5FA45D9A64Ac432888C",
        registryResolver: "0x0D8e2772B4D8d58C8a66EEc5bf77c07934b84942",
        resolver: "0x32d63B83BBA5a25f1f8aE308d7fd1F3c0b1abfA6"
    },
    [opId]:  {
        controller: "0x5C1220C4C5D75aC2d0A2f893995b5eCec98F3Aa6",
        emitter: "0x87516B5518a6548433AB97aE59b15B1A31472F11",
        registryResolver: "0x0798278Ff2c8aD096447B5C368Ce682118D87f63",
        resolver: "0xD8de4F5D7117BA37bA171ec9180Da798056f2CEd"
    },
    [baseSepoliaId]:  {
        controller: "0x56c4A2A6e302B314D600c45a7bA385693486c798",
        emitter: "0xa391631503109f35831d14dC20A16EA83b48c42d",
        registryResolver: "0x71C79717Bb907DBd73b564DA0F591209005a6695",
        resolver: "0x91FE109266b2EEcf6018Cb1ECd957fF9caAd0657"
    },
};

const ensContracts: Record<number, EnsContracts> = {
    [mainnetId]: {
        ensRegistry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        nameWrapper: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
        ethRegistrarController: "0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547",
        publicResolver: "0xF29100983E058B709F3D539b0c765937B804AC15",
        universalResolver: "0xce01f8eee7E479C928F8919abD53E553a36CeF67",
        unwrappedRegistrarController: "0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547",
        baseRegistrar: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85"
    },
    [sepoliaId]: {
        ensRegistry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        nameWrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
        ethRegistrarController: "0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968",
        publicResolver: "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5",
        universalResolver: "0xc8af999e38273d658be1b921b88a9ddf005769cc",
        unwrappedRegistrarController: "0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968",
        baseRegistrar: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"
    }
}

const ensV2Contracts: Record<number, EnsV2Contracts> = {
    [mainnetId]: {
        rootRegistry: "0x2553c09bE6447BeFfdB86FA622ad41fB8f77A91e",
        ethRegistry: "0xf60aba43E1f7F3DAB1186Ff03B561401C9Df85E2",
        ethRegistrar: "0xD6D8369e55c94Ae8AFA714E6cF7AB5bE54D5CC81",
        ethRenewerV1: "0x56c447F308F463A01121C41E72b0E7e7557fCb68",
        verifiableFactory: "0x77510ba162dfeA3d8989E3f0928a691B345730D2",
        userRegistryImpl: "0x75FF9AdBcFcE2469B097AC68f6Ae650EaE1351Bb",
        permissionedResolverImpl: "0x565b0F456a04Ac9b48758190e90030623Cff57C5",
        universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
        paymentTokens: [
            { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
            { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
        ],
    },
    [sepoliaId]: {
        rootRegistry: "0xB458D6a3a77919449d03e7A6903C26827c1eC43f",
        ethRegistry: "0xD4eBcbBdF463C9c45784603Db0dDD499BC44A8B4",
        ethRegistrar: "0xf633e7FC17e2bbE0D0965D18ec1821dcB754a3d3",
        ethRenewerV1: "0xf2ece44980778966b8a0FccB3A9E339440f6e045",
        verifiableFactory: "0xDa70306C98E97eCe36F997a21368e53298572991",
        userRegistryImpl: "0x9BD8a88719068D09ecee662f36C0E3856708366a",
        permissionedResolverImpl: "0x115eb53F0c60696633855F90b138178Fb40b2b2C",
        universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
        paymentTokens: [
            { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 },
            { symbol: "DAI", address: "0xF6faC8A58a0BE13b9197f27C41B73162Fe32572b", decimals: 18 },
        ],
    }
}

// Namespace's ENSv2 subname contracts (thenamespace/onchain-subnames). Not on mainnet yet.
const namespaceV2Contracts: Record<number, NamespaceV2Contracts> = {
    [sepoliaId]: {
        activationManager: "0x0bFCcbd5815332F7ea27ba71BD593B0799110bDE",
        subnameIssuer: "0x5200fd33Cf7952c518f1123797fBA2ce0D77bFC0",
        sharedResolver: "0x7C48b782cF9c132441844aEBA8b46EC2d80ca067",
        splitPaymentModule: "0x50EE6887397838d040e4bA35717b049C154A7fAb",
        features: {
            labelPrices: "0xb8f15B350469187D26009ef4B967B79702DA7cBB",
            specialPrices: "0xDE5f1D2F3291CBFd7BA971F8C14958C1253d9eD3",
            whitelist: "0x48B7c6054836DC0B2291B3b3F2D313e84b4Cc678",
            deadline: "0x50459C582EB6206A2e561C5aec3810bbc5548726",
            reservation: "0x5111d49E9B0E02C26F350A585073A36F38758EAf",
            tokenGate: "0xEbE62D3d5c6A3bEf116cb949c433baF04b6F0D25",
        },
        paymentTokens: [
            { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
            { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 },
        ],
    }
}

export const getEnsContracts = (isTestnet: boolean = false): EnsContracts => {

    return ensContracts[!isTestnet ? mainnetId : sepoliaId]
}

export const getL1NamespaceContracts = (isTestnet: boolean = false): L1ContractAddresses => {
    return l1Contracts[!isTestnet ? mainnetId : sepoliaId];
}

export const getL2NamespaceContracts = (chainId: number): L2ContractAddresses => {
    const contracts = l2Contracts[chainId];

    if (!contracts) {
        throw new Error(`L2 Contracts for chain: ${chainId} are not present`)
    }
    return contracts;

}

export const getEnsV2Contracts = (isTestnet: boolean = false): EnsV2Contracts => {
    return ensV2Contracts[!isTestnet ? mainnetId : sepoliaId];
}

// Null where Namespace's ENSv2 contracts aren't deployed
export const getNamespaceV2Contracts = (isTestnet: boolean = false): NamespaceV2Contracts | null => {
    return namespaceV2Contracts[!isTestnet ? mainnetId : sepoliaId] ?? null;
}
