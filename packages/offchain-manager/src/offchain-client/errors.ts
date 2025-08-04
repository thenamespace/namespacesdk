export class NamespaceSDKError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'NamespaceSDKError';
    }
}

export class AuthenticationError extends NamespaceSDKError {
    constructor(message: string = 'Authentication failed. Please check your API key.') {
        super(message, 'AUTH_ERROR');
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends NamespaceSDKError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class SubnameNotFoundError extends NamespaceSDKError {
    constructor(subname: string) {
        super(`Subname not found: ${subname}`, 'SUBDOMAIN_NOT_FOUND');
        this.name = 'SubnameNotFoundError';
    }
}

export class SubnameAlreadyExistsError extends NamespaceSDKError {
    constructor(subname: string) {
        super(`Subname already exists: ${subname}`, 'SUBDOMAIN_EXISTS');
        this.name = 'SubnameAlreadyExistsError';
    }
}

export class RateLimitError extends NamespaceSDKError {
    constructor(message: string = 'Rate limit exceeded. Please try again later.') {
        super(message, 'RATE_LIMIT');
        this.name = 'RateLimitError';
    }
} 