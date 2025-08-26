/**
 * Configuration utilities for managing API keys and settings
 */

import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { APIKeyType } from '../types/index.js';

// Configuration file path
const CONFIG_DIR = join(homedir(), '.mcp-hats');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Configuration structure
 */
interface Config {
  apiKeys: Partial<Record<APIKeyType, string>>;
  settings: {
    cacheEnabled: boolean;
    cacheTtlSeconds: number;
    logLevel: string;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Config = {
  apiKeys: {},
  settings: {
    cacheEnabled: true,
    cacheTtlSeconds: 300,
    logLevel: 'info'
  }
};

/**
 * Ensure configuration directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await access(CONFIG_DIR);
  } catch {
    const { mkdir } = await import('fs/promises');
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from file
 */
export async function loadConfig(): Promise<Config> {
  await ensureConfigDir();
  
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    // Return default config if file doesn't exist or is invalid
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Set an API key
 */
export async function setAPIKey(keyName: APIKeyType, value: string): Promise<void> {
  const config = await loadConfig();
  config.apiKeys[keyName] = value;
  await saveConfig(config);
}

/**
 * Get an API key
 */
export async function getAPIKey(keyName: APIKeyType): Promise<string | undefined> {
  // First check environment variables
  const envValue = process.env[keyName];
  if (envValue) {
    return envValue;
  }
  
  // Then check saved config
  const config = await loadConfig();
  return config.apiKeys[keyName];
}

/**
 * Remove an API key
 */
export async function removeAPIKey(keyName: APIKeyType): Promise<void> {
  const config = await loadConfig();
  delete config.apiKeys[keyName];
  await saveConfig(config);
}

/**
 * List all configured API keys (without values)
 */
export async function listAPIKeys(): Promise<Record<APIKeyType, boolean>> {
  const config = await loadConfig();
  const keys: Record<APIKeyType, boolean> = {} as any;
  
  const allKeyTypes: APIKeyType[] = [
    'ALCHEMY_API_KEY',
    'INFURA_API_KEY',
    'ETHERSCAN_API_KEY',
    'POLYGONSCAN_API_KEY',
    'ARBISCAN_API_KEY',
    'OPTIMISTIC_ETHERSCAN_API_KEY',
    'BASESCAN_API_KEY',
    'GNOSISSCAN_API_KEY'
  ];
  
  for (const keyType of allKeyTypes) {
    // Check both env and config
    const hasKey = !!(process.env[keyType] || config.apiKeys[keyType]);
    keys[keyType] = hasKey;
  }
  
  return keys;
}

/**
 * Resolve API key from a template string
 * Example: "https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
 */
export async function resolveAPIKey(template: string): Promise<string | undefined> {
  const match = template.match(/\$\{([^}]+)\}/);
  if (!match) {
    return undefined;
  }
  
  const keyName = match[1] as APIKeyType;
  return await getAPIKey(keyName);
}

/**
 * Get cache settings
 */
export async function getCacheSettings(): Promise<{
  enabled: boolean;
  ttlSeconds: number;
}> {
  const config = await loadConfig();
  return {
    enabled: config.settings.cacheEnabled,
    ttlSeconds: config.settings.cacheTtlSeconds
  };
}

/**
 * Update cache settings
 */
export async function updateCacheSettings(settings: {
  enabled?: boolean;
  ttlSeconds?: number;
}): Promise<void> {
  const config = await loadConfig();
  if (settings.enabled !== undefined) {
    config.settings.cacheEnabled = settings.enabled;
  }
  if (settings.ttlSeconds !== undefined) {
    config.settings.cacheTtlSeconds = settings.ttlSeconds;
  }
  await saveConfig(config);
}

/**
 * Get log level
 */
export async function getLogLevel(): Promise<string> {
  const config = await loadConfig();
  return config.settings.logLevel;
}

/**
 * Set log level
 */
export async function setLogLevel(level: string): Promise<void> {
  const config = await loadConfig();
  config.settings.logLevel = level;
  await saveConfig(config);
}

/**
 * Clear all configuration
 */
export async function clearConfig(): Promise<void> {
  await saveConfig(DEFAULT_CONFIG);
}

/**
 * Export configuration (for backup)
 */
export async function exportConfig(): Promise<string> {
  const config = await loadConfig();
  // Mask API key values for security
  const maskedConfig = {
    ...config,
    apiKeys: Object.fromEntries(
      Object.entries(config.apiKeys).map(([key, value]) => [
        key,
        value ? '***' + value.slice(-4) : undefined
      ])
    )
  };
  return JSON.stringify(maskedConfig, null, 2);
}

/**
 * Import configuration (restore from backup)
 */
export async function importConfig(configJson: string): Promise<void> {
  try {
    const imported = JSON.parse(configJson);
    const config = await loadConfig();
    
    // Only import non-masked API keys
    if (imported.apiKeys) {
      for (const [key, value] of Object.entries(imported.apiKeys)) {
        if (value && !String(value).startsWith('***')) {
          config.apiKeys[key as APIKeyType] = String(value);
        }
      }
    }
    
    // Import settings
    if (imported.settings) {
      config.settings = { ...config.settings, ...imported.settings };
    }
    
    await saveConfig(config);
  } catch (error) {
    throw new Error(`Invalid configuration JSON: ${error}`);
  }
}