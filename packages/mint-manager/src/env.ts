export type NamespaceEnv = "staging" | "production"

interface LibEnv {
    listingApi: Record<NamespaceEnv, string>
    mintingApi: Record<NamespaceEnv, string>
}

export const LibEnvironment: LibEnv = {
    listingApi: {
        production: "https://list-manager.namespace.ninja",
        staging: "https://staging.list-manager.namespace.ninja"
    },
    mintingApi: {
        production: "https://mint-manager.namespace.ninja",
        staging: "https://staging.mint-manager.namespace.ninja"
    }
}