/* eslint-disable no-void -- promesas deliberadamente no esperadas */
import {useSyncExternalStore} from 'react';
import type {ClientSession, ClientSnapshot} from './client';
import type {HostSession, HostSnapshot} from './host';

/** Las sesiones no son serializables: viven aquí (fuera de los parámetros de navegación). */
let host: HostSession | null = null;
let client: ClientSession | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const sub = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const sessions = {
  host: () => host,
  client: () => client,
  setHost(h: HostSession | null) {
    void host?.close();
    host = h;
    emit();
  },
  setClient(c: ClientSession | null) {
    client?.leave();
    client = c;
    emit();
  },
  closeAll() {
    this.setHost(null);
    this.setClient(null);
  },
};

export const useHost = () => useSyncExternalStore(sub, () => host);
export const useClient = () => useSyncExternalStore(sub, () => client);

const NOOP = () => () => {};
export function useHostSnapshot(h: HostSession | null): HostSnapshot | null {
  return useSyncExternalStore(h ? h.state.subscribe : NOOP, () => (h ? h.state.get() : null));
}
export function useClientSnapshot(c: ClientSession | null): ClientSnapshot | null {
  return useSyncExternalStore(c ? c.state.subscribe : NOOP, () => (c ? c.state.get() : null));
}
