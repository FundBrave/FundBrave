import { GraphQLScalarType, Kind } from 'graphql';

/**
 * Custom BigInt scalar for handling large numbers (e.g., token amounts)
 * Stored as string in the database, transmitted as string over GraphQL
 */
export const BigIntScalar = new GraphQLScalarType({
  name: 'BigInt',
  description: 'A large integer represented as a string',
  serialize(value: unknown): string {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    throw new Error('BigInt can only serialize bigint, string, or number values');
  },
  parseValue(value: unknown): string {
    if (typeof value === 'string') {
      // Validate it's a valid integer string
      if (!/^-?\d+$/.test(value)) {
        throw new Error('BigInt must be a valid integer string');
      }
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    throw new Error('BigInt can only parse string or number values');
  },
  parseLiteral(ast): string {
    if (ast.kind === Kind.STRING) {
      if (!/^-?\d+$/.test(ast.value)) {
        throw new Error('BigInt must be a valid integer string');
      }
      return ast.value;
    }
    if (ast.kind === Kind.INT) {
      return ast.value;
    }
    throw new Error('BigInt can only parse string or int literals');
  },
});

/**
 * Custom DateTime scalar for proper date handling
 */
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A date-time string in ISO 8601 format',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new Error('DateTime can only serialize Date or string values');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date string');
      }
      return date;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    throw new Error('DateTime can only parse string or number values');
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date string');
      }
      return date;
    }
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    throw new Error('DateTime can only parse string or int literals');
  },
});

/**
 * Ethereum address scalar with validation
 */
export const EthAddressScalar = new GraphQLScalarType({
  name: 'EthAddress',
  description: 'An Ethereum address (0x prefixed, 40 hex characters)',
  serialize(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error('EthAddress must be a string');
    }
    return value.toLowerCase();
  },
  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error('EthAddress must be a string');
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      throw new Error('Invalid Ethereum address format');
    }
    return value.toLowerCase();
  },
  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new Error('EthAddress must be a string');
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(ast.value)) {
      throw new Error('Invalid Ethereum address format');
    }
    return ast.value.toLowerCase();
  },
});

/**
 * Transaction hash scalar with validation
 */
export const TxHashScalar = new GraphQLScalarType({
  name: 'TxHash',
  description: 'A transaction hash (0x prefixed, 64 hex characters)',
  serialize(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error('TxHash must be a string');
    }
    return value.toLowerCase();
  },
  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error('TxHash must be a string');
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
      throw new Error('Invalid transaction hash format');
    }
    return value.toLowerCase();
  },
  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new Error('TxHash must be a string');
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(ast.value)) {
      throw new Error('Invalid transaction hash format');
    }
    return ast.value.toLowerCase();
  },
});
