// Generated from packages/contracts/out/ReservationFeature.sol/ReservationFeature.json. Do not edit by hand:
// run `npm run sdk abis` after rebuilding the contracts.
export const ReservationFeatureAbi = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "manager_",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "configure",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "data",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "evaluate",
      "inputs": [
        {
          "name": "ctx",
          "type": "tuple",
          "internalType": "struct IFeatureModule.MintContext",
          "components": [
            {
              "name": "activationId",
              "type": "bytes32",
              "internalType": "bytes32"
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
              "name": "renewal",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "extraData",
              "type": "bytes",
              "internalType": "bytes"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "result",
          "type": "tuple",
          "internalType": "struct Types.MintEvaluation",
          "components": [
            {
              "name": "denied",
              "type": "uint8",
              "internalType": "enum Types.DeniedReason"
            },
            {
              "name": "priceLevel",
              "type": "uint8",
              "internalType": "enum Types.PriceLevel"
            },
            {
              "name": "price",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
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
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "roots",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "root",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "ReservationConfigured",
      "inputs": [
        {
          "name": "activationId",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "root",
          "type": "bytes32",
          "indexed": false,
          "internalType": "bytes32"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "InvalidReservationData",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotManager",
      "inputs": [
        {
          "name": "caller",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ZeroManager",
      "inputs": []
    }
  ] as const;
