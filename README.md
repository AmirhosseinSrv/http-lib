# ts-http-lib

A flexible TypeScript HTTP client library that provides a unified interface for working with various HTTP client providers.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-24292e.svg?style=for-the-badge&logo=github)](https://github.com/AmirhosseinSrv/ts-http-lib)
[![npm version](https://img.shields.io/npm/v/ts-http-lib.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/ts-http-lib)

## Features

- 🔄 **Multi-provider Support**: Seamlessly switch between popular HTTP client providers:
  - [Axios](https://axios-http.com/)
  - [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
  - [Ky](https://github.com/sindresorhus/ky)
  - [SuperAgent](https://github.com/ladjs/superagent)
- 🏗️ **Factory Pattern**: Simple client creation with a factory method to abstract implementation details
- 🛡️ **Type Safety**: Full TypeScript support with accurate type definitions
- ✅ **Schema Validation**: Optional [Zod](https://github.com/colinhacks/zod) schema validation for API responses
- 🔍 **Interceptors**: Register request and response interceptors
- 🏭 **Singleton Pattern**: Efficient instance management with singleton pattern implementation

## Installation

```bash
# Using npm
npm install ts-http-lib

# Using yarn
yarn add ts-http-lib

# Using pnpm
pnpm add ts-http-lib
```

## Usage

### Basic Example

```typescript
import { createHttpClient } from 'ts-http-lib';

// Create a client with your preferred provider using the Factory pattern
const axiosClient = createHttpClient('axios');
const fetchClient = createHttpClient('fetch');
const kyClient = createHttpClient('ky');
const superagentClient = createHttpClient('superagent');

// Make HTTP requests
(async () => {
  try {
    // GET request
    const response = await axiosClient.get('https://api.example.com/data');
    console.log(response.data);
    
    // POST request with data
    const createResponse = await axiosClient.post(
      'https://api.example.com/items',
      { name: 'New Item', value: 42 }
    );
    console.log(createResponse.data);
  } catch (error) {
    console.error('API request failed:', error);
  }
})();
```

### Using Response Validation with Zod

```typescript
import { createHttpClient } from 'ts-http-lib';
import { z } from 'zod';

const userClient = createHttpClient('axios');

// Define a schema for your data
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// Fetch with validation
const getUser = async (id: number) => {
  const response = await userClient.get(
    `https://api.example.com/users/${id}`,
    {},  // optional request config
    UserSchema  // Zod schema for validation
  );
  
  return response.data;
};
```

### Using Interceptors

```typescript
import { createHttpClient } from 'ts-http-lib';

const client = createHttpClient('axios');

// Add authentication to all requests
client.registerRequestInterceptors([
  (config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    return config;
  }
]);

// Handle errors or modify responses
client.registerResponseInterceptors([
  (response) => {
    // Process successful responses
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
    }
    return Promise.reject(error);
  }
]);
```

## API Reference

### `createHttpClient(provider)`

Factory method that creates a new HTTP client instance with the specified provider. The factory pattern is used to abstract the creation logic and provide a simple interface for obtaining client instances.

| Parameter | Type | Description |
|-----------|------|-------------|
| provider | 'axios' \| 'fetch' \| 'ky' \| 'superagent' | The HTTP client provider to use |

Returns an instance of the specified HTTP client with the following methods:

- `get(url, config?, zodSchema?)`
- `post(url, data, config?, zodSchema?)`
- `put(url, data, config?, zodSchema?)`
- `delete(url, config?, zodSchema?)`
- `registerRequestInterceptors(interceptors)`
- `registerResponseInterceptors(interceptors)`

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Generate test coverage
pnpm coverage

# Build the library
pnpm build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Repository

You can find the source code on GitHub:
[https://github.com/AmirhosseinSrv/ts-http-lib](https://github.com/AmirhosseinSrv/ts-http-lib)

## License

[MIT](LICENSE)