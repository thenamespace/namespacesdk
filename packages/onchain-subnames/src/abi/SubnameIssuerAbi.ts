// Generated from packages/contracts/out/SubnameIssuer.sol/SubnameIssuer.json. Do not edit by hand:
// run `npm run sdk abis` after rebuilding the contracts.
export const SubnameIssuerAbi = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "manager_",
          "type": "address",
          "internalType": "contract IActivationManager"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "UPGRADE_INTERFACE_VERSION",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "clearNameFee",
      "inputs": [
        {
          "name": "name",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "defaultFeeBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "ethRegistry",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract IENSv2Registry"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "feeBpsFor",
      "inputs": [
        {
          "name": "name",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "initialize",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "isSupportedPaymentToken",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "manager",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract IActivationManager"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "multicall",
      "inputs": [
        {
          "name": "data",
          "type": "bytes[]",
          "internalType": "bytes[]"
        }
      ],
      "outputs": [
        {
          "name": "results",
          "type": "bytes[]",
          "internalType": "bytes[]"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "nameFee",
      "inputs": [
        {
          "name": "name",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "set",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "bps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "proxiableUUID",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "quotePayment",
      "inputs": [
        {
          "name": "usdAmount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "register",
      "inputs": [
        {
          "name": "request",
          "type": "tuple",
          "internalType": "struct ISubnameIssuer.MintRequest",
          "components": [
            {
              "name": "parentLabel",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "label",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "resolver",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "duration",
              "type": "uint64",
              "internalType": "uint64"
            },
            {
              "name": "extraData",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "paymentToken",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "tokenId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "removePaymentToken",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "renew",
      "inputs": [
        {
          "name": "request",
          "type": "tuple",
          "internalType": "struct ISubnameIssuer.RenewRequest",
          "components": [
            {
              "name": "parentLabel",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "label",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "duration",
              "type": "uint64",
              "internalType": "uint64"
            },
            {
              "name": "extraData",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        },
        {
          "name": "paymentToken",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "newExpiry",
          "type": "uint64",
          "internalType": "uint64"
        }
      ],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setDefaultFee",
      "inputs": [
        {
          "name": "bps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setNameFee",
      "inputs": [
        {
          "name": "name",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "bps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setPaymentToken",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "tokenDecimals",
          "type": "uint8",
          "internalType": "uint8"
        },
        {
          "name": "oracle",
          "type": "address",
          "internalType": "contract IAggregatorV3"
        },
        {
          "name": "maxStaleness",
          "type": "uint64",
          "internalType": "uint64"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "tokenConfig",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "supported",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "tokenDecimals",
          "type": "uint8",
          "internalType": "uint8"
        },
        {
          "name": "oracleDecimals",
          "type": "uint8",
          "internalType": "uint8"
        },
        {
          "name": "maxStaleness",
          "type": "uint64",
          "internalType": "uint64"
        },
        {
          "name": "oracle",
          "type": "address",
          "internalType": "contract IAggregatorV3"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "upgradeToAndCall",
      "inputs": [
        {
          "name": "newImplementation",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "data",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "withdrawFees",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "to",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "DefaultFeeSet",
      "inputs": [
        {
          "name": "bps",
          "type": "uint16",
          "indexed": false,
          "internalType": "uint16"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeeCollected",
      "inputs": [
        {
          "name": "paymentToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeeWithdrawn",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "to",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Initialized",
      "inputs": [
        {
          "name": "version",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NameFeeCleared",
      "inputs": [
        {
          "name": "name",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "NameFeeSet",
      "inputs": [
        {
          "name": "name",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "bps",
          "type": "uint16",
          "indexed": false,
          "internalType": "uint16"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PaymentTokenRemoved",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PaymentTokenSet",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "tokenDecimals",
          "type": "uint8",
          "indexed": false,
          "internalType": "uint8"
        },
        {
          "name": "oracle",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "maxStaleness",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "SubnameRegistered",
      "inputs": [
        {
          "name": "parent",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "label",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "usdPrice",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "paymentToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "payment",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "expiry",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "SubnameRenewed",
      "inputs": [
        {
          "name": "parent",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "label",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "renewer",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "usdPrice",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "paymentToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "payment",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "newExpiry",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Upgraded",
      "inputs": [
        {
          "name": "implementation",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "AddressEmptyCode",
      "inputs": [
        {
          "name": "target",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ERC1967InvalidImplementation",
      "inputs": [
        {
          "name": "implementation",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ERC1967NonPayable",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ExpiryOverflow",
      "inputs": [
        {
          "name": "expiry",
          "type": "uint64",
          "internalType": "uint64"
        },
        {
          "name": "duration",
          "type": "uint64",
          "internalType": "uint64"
        }
      ]
    },
    {
      "type": "error",
      "name": "FailedCall",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InsufficientPayment",
      "inputs": [
        {
          "name": "provided",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "required",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidFee",
      "inputs": [
        {
          "name": "bps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidInitialization",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidOraclePrice",
      "inputs": [
        {
          "name": "answer",
          "type": "int256",
          "internalType": "int256"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidOracleRound",
      "inputs": [
        {
          "name": "roundId",
          "type": "uint80",
          "internalType": "uint80"
        },
        {
          "name": "startedAt",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "answeredInRound",
          "type": "uint80",
          "internalType": "uint80"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidTokenDecimals",
      "inputs": [
        {
          "name": "tokenDecimals",
          "type": "uint8",
          "internalType": "uint8"
        }
      ]
    },
    {
      "type": "error",
      "name": "MintDenied",
      "inputs": [
        {
          "name": "reason",
          "type": "uint8",
          "internalType": "enum Types.DeniedReason"
        }
      ]
    },
    {
      "type": "error",
      "name": "NoSubnameRegistry",
      "inputs": [
        {
          "name": "parentLabel",
          "type": "string",
          "internalType": "string"
        }
      ]
    },
    {
      "type": "error",
      "name": "NotInitializing",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotRenewable",
      "inputs": [
        {
          "name": "label",
          "type": "string",
          "internalType": "string"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "PaymentTransferFailed",
      "inputs": [
        {
          "name": "to",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ReentrancyGuardReentrantCall",
      "inputs": []
    },
    {
      "type": "error",
      "name": "RenewalDenied",
      "inputs": [
        {
          "name": "reason",
          "type": "uint8",
          "internalType": "enum Types.DeniedReason"
        }
      ]
    },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "StaleOraclePrice",
      "inputs": [
        {
          "name": "updatedAt",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "maxStaleness",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "SubregistryMismatch",
      "inputs": [
        {
          "name": "parentLabel",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "bound",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "current",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "UUPSUnauthorizedCallContext",
      "inputs": []
    },
    {
      "type": "error",
      "name": "UUPSUnsupportedProxiableUUID",
      "inputs": [
        {
          "name": "slot",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ]
    },
    {
      "type": "error",
      "name": "UnexpectedValue",
      "inputs": []
    },
    {
      "type": "error",
      "name": "UnsupportedPaymentToken",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ZeroOwner",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ZeroReceiver",
      "inputs": []
    }
  ] as const;
