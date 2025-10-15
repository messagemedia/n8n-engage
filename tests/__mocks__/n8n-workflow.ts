export class NodeApiError extends Error {
  constructor(_node: unknown, options: { message: string }) {
    super(options.message);
    this.name = 'NodeApiError';
  }
}

// Minimal shapes to satisfy type references when bundling tests
export type IExecuteFunctions = any;
export type INodeExecutionData = any;
export type INodeType = any;
export type INodeTypeDescription = any;
export type NodeConnectionType = any;
export type IDataObject = Record<string, any>;