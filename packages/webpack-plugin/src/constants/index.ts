import path from 'path';
import { GojiWebpackPluginOptions } from '../types';

export const DEFAULT_OPTIONS: GojiWebpackPluginOptions = {
  maxDepth: 10,
  target: 'wechat',
  minimize: process.env.NODE_ENV !== 'development',
};

export const BRIDGE_OUTPUT_PATH = '_goji';

export const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');
