// Generated from packages/contracts/out/ActivationManager.sol/ActivationManager.json. Do not edit by hand:
// run `npm run sdk abis` after rebuilding the contracts.
export const ActivationManagerAbi = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "ethRegistry_",
          "type": "address",
          "internalType": "contract IENSv2Registry"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "activate",
      "inputs": [
        {
          "name": "request",
          "type": "tuple",
          "internalType": "struct IActivationManager.ActivationRequest",
          "components": [
            {
              "name": "label",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "basePrice",
              "type": "uint64",
              "internalType": "uint64"
            },
            {
              "name": "expiration",
              "type": "uint8",
              "internalType": "enum Types.Expiration"
            },
            {
              "name": "roleBitmap",
              "type": "uint8",
              "internalType": "uint8"
            },
            {
              "name": "resolver",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "features",
              "type": "tuple[]",
              "internalType": "struct IActivationManager.FeatureConfig[]",
              "components": [
                {
                  "name": "feature",
                  "type": "address",
                  "internalType": "contract IFeatureModule"
                },
                {
                  "name": "data",
                  "type": "bytes",
                  "internalType": "bytes"
                }
              ]
            },
            {
              "name": "paymentModule",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "paymentModuleData",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "activationIdOf",
      "inputs": [
        {
          "name": "parent",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "activations",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "active",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "basePrice",
          "type": "uint64",
          "internalType": "uint64"
        },
        {
          "name": "expiration",
          "type": "uint8",
          "internalType": "enum Types.Expiration"
        },
        {
          "name": "roleBitmap",
          "type": "uint8",
          "internalType": "uint8"
        },
        {
          "name": "paymentModule",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "parent",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "resolver",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "featureBlob",
          "type": "bytes",
          "internalType": "bytes"
        },
        {
          "name": "subregistry",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "defaultResolver",
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
      "name": "featureRegistered",
      "inputs": [
        {
          "name": "feature",
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
      "name": "featuresOf",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "list",
          "type": "address[]",
          "internalType": "address[]"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getPaymentReceivers",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "receivers",
          "type": "tuple[]",
          "internalType": "struct Types.Receiver[]",
          "components": [
            {
              "name": "to",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "bps",
              "type": "uint16",
              "internalType": "uint16"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getSubnameMetadata",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "requested",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "metadata",
          "type": "tuple",
          "internalType": "struct Types.MintMetadata",
          "components": [
            {
              "name": "receivers",
              "type": "tuple[]",
              "internalType": "struct Types.Receiver[]",
              "components": [
                {
                  "name": "to",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "bps",
                  "type": "uint16",
                  "internalType": "uint16"
                }
              ]
            },
            {
              "name": "roleBitmap",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "resolver",
              "type": "address",
              "internalType": "address"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getSubnameResolver",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "requested",
          "type": "address",
          "internalType": "address"
        }
      ],
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
      "name": "getSubnameRoles",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
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
      "name": "modifyActivationFeature",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "features",
          "type": "tuple[]",
          "internalType": "struct IActivationManager.FeatureConfig[]",
          "components": [
            {
              "name": "feature",
              "type": "address",
              "internalType": "contract IFeatureModule"
            },
            {
              "name": "data",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
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
      "name": "paymentModuleRegistered",
      "inputs": [
        {
          "name": "paymentModule",
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
      "name": "quoteMint",
      "inputs": [
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
          "name": "minter",
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
      ],
      "outputs": [
        {
          "name": "result",
          "type": "tuple",
          "internalType": "struct Types.QuoteMintResult",
          "components": [
            {
              "name": "canMint",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "price",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "denied",
              "type": "uint8",
              "internalType": "enum Types.DeniedReason"
            },
            {
              "name": "expiration",
              "type": "uint8",
              "internalType": "enum Types.Expiration"
            },
            {
              "name": "activationId",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "subregistry",
              "type": "address",
              "internalType": "address"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "quoteRenewal",
      "inputs": [
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
          "name": "renewer",
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
      ],
      "outputs": [
        {
          "name": "result",
          "type": "tuple",
          "internalType": "struct Types.QuoteRenewalResult",
          "components": [
            {
              "name": "canRenew",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "price",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "denied",
              "type": "uint8",
              "internalType": "enum Types.DeniedReason"
            },
            {
              "name": "activationId",
              "type": "bytes32",
              "internalType": "bytes32"
            },
            {
              "name": "subregistry",
              "type": "address",
              "internalType": "address"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "removeActivationFeature",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "features",
          "type": "address[]",
          "internalType": "address[]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
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
      "name": "setActive",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "active",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setBasePrice",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "basePrice",
          "type": "uint64",
          "internalType": "uint64"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setDefaultResolver",
      "inputs": [
        {
          "name": "resolver",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setExpiration",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "expiration",
          "type": "uint8",
          "internalType": "enum Types.Expiration"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setFeatureRegistered",
      "inputs": [
        {
          "name": "feature",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "registered",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setPaymentModule",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "paymentModule",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "config",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setPaymentModuleRegistered",
      "inputs": [
        {
          "name": "paymentModule",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "registered",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setRoleBitmap",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "roleBitmap",
          "type": "uint8",
          "internalType": "uint8"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setSubnameResolver",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "resolver",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
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
      "name": "versions",
      "inputs": [
        {
          "name": "parent",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "version",
          "type": "uint64",
          "internalType": "uint64"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "Activated",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
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
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "version",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        },
        {
          "name": "basePrice",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        },
        {
          "name": "expiration",
          "type": "uint8",
          "indexed": false,
          "internalType": "enum Types.Expiration"
        },
        {
          "name": "roleBitmap",
          "type": "uint8",
          "indexed": false,
          "internalType": "uint8"
        },
        {
          "name": "resolver",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "ActivationStatusSet",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "active",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "BasePriceSet",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "basePrice",
          "type": "uint64",
          "indexed": false,
          "internalType": "uint64"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DefaultResolverSet",
      "inputs": [
        {
          "name": "resolver",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "ExpirationSet",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "expiration",
          "type": "uint8",
          "indexed": false,
          "internalType": "enum Types.Expiration"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeatureConfigured",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "feature",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeatureRegistered",
      "inputs": [
        {
          "name": "feature",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "registered",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeatureRemoved",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "feature",
          "type": "address",
          "indexed": true,
          "internalType": "address"
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
      "name": "PaymentModuleRegistered",
      "inputs": [
        {
          "name": "paymentModule",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "registered",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PaymentModuleSet",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "paymentModule",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "RoleBitmapSet",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "roleBitmap",
          "type": "uint8",
          "indexed": false,
          "internalType": "uint8"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "SubnameResolverSet",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "resolver",
          "type": "address",
          "indexed": false,
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
      "name": "DuplicateFeature",
      "inputs": [
        {
          "name": "feature",
          "type": "address",
          "internalType": "address"
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
      "name": "FeatureNotContract",
      "inputs": [
        {
          "name": "feature",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "FeatureNotRegistered",
      "inputs": [
        {
          "name": "feature",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidRoleBitmap",
      "inputs": [
        {
          "name": "roleBitmap",
          "type": "uint8",
          "internalType": "uint8"
        }
      ]
    },
    {
      "type": "error",
      "name": "MalformedSplit",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NoSubregistry",
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
      "name": "NotActivated",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "parent",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ]
    },
    {
      "type": "error",
      "name": "NotRegistryAdmin",
      "inputs": [
        {
          "name": "subregistry",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
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
      "name": "ZeroRegistry",
      "inputs": []
    }
  ] as const;
