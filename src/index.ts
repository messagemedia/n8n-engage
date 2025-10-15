import { SmsSender } from './nodes/SmsSender/SmsSender.node';
import { MessageMediaApi } from './credentials/MessageMediaApi.credentials';

export const nodes = [SmsSender];
export const credentials = [MessageMediaApi];

// Also export as default for n8n compatibility
export default {
  nodes: [SmsSender],
  credentials: [MessageMediaApi],
};