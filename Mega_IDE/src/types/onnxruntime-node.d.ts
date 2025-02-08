declare module 'onnxruntime-node' {
  export interface InferenceSession {
    run(feeds: { [key: string]: any }): Promise<{ [key: string]: any }>;
  }

  export interface Tensor {
    data: Float32Array | Int32Array | Int8Array;
    dims: number[];
    type: string;
  }

  export interface SessionOptions {
    executionProviders?: string[];
    graphOptimizationLevel?: string;
    logSeverityLevel?: number;
    logVerbosityLevel?: number;
    optimizedModelFilePath?: string;
    enableCpuMemArena?: boolean;
    enableMemPattern?: boolean;
    executionMode?: string;
    extra?: { [key: string]: any };
  }

  export interface Backend {
    name: string;
    priority: number;
  }

  export interface Environment {
    backends: {
      onnx: {
        wasm: {
          numThreads: number;
        };
        backend: string;
        provider: string;
      };
    };
  }

  export function InferenceSession(
    modelPath: string,
    options?: SessionOptions
  ): Promise<InferenceSession>;

  export function Tensor(
    type: string,
    data: Float32Array | Int32Array | Int8Array,
    dims: number[]
  ): Tensor;
}
