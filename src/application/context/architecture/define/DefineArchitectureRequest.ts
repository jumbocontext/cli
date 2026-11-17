export interface DefineArchitectureRequest {
  readonly description: string;
  readonly organization: string;
  readonly patterns?: string[];
  readonly principles?: string[];
  readonly dataStores?: string[]; // Format: "name:type:purpose"
  readonly stack?: string[];
}
