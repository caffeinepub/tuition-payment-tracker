import type { ActorMethod } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";

export interface backendInterface {
  ping: ActorMethod<[], string>;
}

export type CreateActorOptions = {
  agentOptions?: Record<string, unknown>;
};

export declare class ExternalBlob {
  getBytes(): Promise<Uint8Array>;
  onProgress?: (progress: number) => void;
  static fromURL(url: string): ExternalBlob;
}

export declare function createActor(
  canisterId: string,
  uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): backendInterface;
