// Data processing rule types
export enum ProcessorType {
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
  REPLACE = 'replace',
  TRANSFORM = 'transform',
  CONDITIONAL = 'conditional',
  NONE = 'none'
}

// Data processing rule interface
export interface DataProcessor {
  fieldId: string;
  processorType: ProcessorType;
  processorValue?: string;
  processorCondition?: string;
  customProcessor?: string; // Stores custom processing function as a string
  enabled: boolean;
}

// Data processor configuration
export interface DataProcessorConfig {
  processors: DataProcessor[];
}
