/**
 * Contenthash codecs supported by `@ensdomains/content-hash`.
 *
 * The string values are multicodec identifiers passed straight to the encoder.
 * Reference the enum members rather than the raw strings, the members are the
 * stable API, the identifiers are an implementation detail of the codec table.
 */
export enum ContenthashType {
    // "ipfs" (without the suffix) silently encodes as the `p2p` codec (0xa503)
    // and skips CID validation entirely. "ipfs-ns" is the 0xe301 codec ENS
    // resolvers actually expect, and it rejects malformed CIDs.
    Ipfs = "ipfs-ns",
    Ipns = "ipns-ns",
    Onion = "onion3",
    // The `-ns` suffix is required by the codec table. Without it the encoder
    // rejects the value with "multicodec not recognized".
    Swarm = "swarm-ns",
    Arweave = "arweave-ns",
    Skynet = "skynet-ns"
}
