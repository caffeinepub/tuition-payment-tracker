import { Actor, HttpAgent } from "@dfinity/agent";
import type { ActorMethod } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";

export interface backendInterface {
  ping: ActorMethod<[], string>;
}

export type CreateActorOptions = {
  agentOptions?: Record<string, unknown>;
  agent?: HttpAgent;
  processError?: (e: unknown) => never;
};

export class ExternalBlob {
  private _bytes?: Uint8Array;
  private _url?: string;
  onProgress?: (progress: number) => void;

  private constructor() {}

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const res = await fetch(this._url);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
    throw new Error("ExternalBlob: no data");
  }

  static fromURL(url: string): ExternalBlob {
    const blob = new ExternalBlob();
    blob._url = url;
    return blob;
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const blob = new ExternalBlob();
    blob._bytes = bytes;
    return blob;
  }
}

const idlFactory: IDL.InterfaceFactory = ({ IDL: I }) => {
  return I.Service({
    ping: I.Func([], [I.Text], ["query"]),
  });
};

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): backendInterface {
  const agent =
    options?.agent ??
    new HttpAgent({ ...(options?.agentOptions ?? {})} );

  return Actor.createActor<backendInterface>(idlFactory, {
    agent,
    canisterId,
  });
}
