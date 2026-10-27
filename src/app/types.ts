import type {GameMode, SuspectId, WitnessId} from '../domain';
import type {NetMode} from '../net/protocol';

export type RootStackParamList = {
  Home: undefined;
  Setup: {mode: 'solo' | NetMode};
  Multi: undefined;
  LobbyHost: undefined;
  LobbyJoin: {mode: NetMode};
  Board: undefined;
  Result: undefined;
  Rules: undefined;
  Stats: undefined;
  Settings: undefined;
  // hojas modales
  Notes: undefined;
  Reference: undefined;
  Solve: undefined;
  Options: undefined;
  Detail:
    | {kind: 'suspect'; id: SuspectId}
    | {kind: 'testimony'; id: SuspectId}
    | {kind: 'witness'; id: WitnessId};
};

export type {GameMode};
