import {z} from 'zod';
import {hmac} from '@noble/hashes/hmac';
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex, utf8ToBytes} from '@noble/hashes/utils';

export const PROTOCOL_VERSION = 1 as const;
export const RULES_VERSION = 1 as const;

const SuspectIdZ = z.enum(['Tavio', 'Pili', 'Pork', 'Charlot', 'Lolo', 'Luisa', 'Charls', 'Reisy']);
const WitnessIdZ = z.enum(['Thomas', 'Mr. Red', 'La Vicente', 'Croqueta Batista']);
const Quant = z.enum(['SOME', 'NONE']);
const Dir = z.enum(['MORE', 'LESS']);
const Axis = z.enum(['WARM', 'COLD']);
const Gender = z.enum(['M', 'F']);
const Level = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

export const StatementZ = z.discriminatedUnion('kind', [
  z.object({kind: z.literal('SELF_GUILTY')}),
  z.object({kind: z.literal('SELF_INNOCENT')}),
  z.object({kind: z.literal('ACCUSE'), target: SuspectIdZ}),
  z.object({kind: z.literal('CLEAR'), target: SuspectIdZ}),
  z.object({kind: z.literal('LIAR'), target: SuspectIdZ}),
  z.object({kind: z.literal('TRUTHFUL'), target: SuspectIdZ}),
  z.object({kind: z.literal('GENDER'), q: Quant, gender: Gender}),
  z.object({kind: z.literal('TRAIT'), q: Quant, level: Level}),
  z.object({kind: z.literal('COMPARE'), q: Quant, dir: Dir, axis: Axis}),
  z.object({kind: z.literal('GENDER_COMPARE'), gender: Gender, dir: Dir, axis: Axis}),
]);

const SolutionZ = z.object({killers: z.array(SuspectIdZ).max(8), liars: z.array(SuspectIdZ).max(8)});

/** Caso que viaja por red. `solution` sólo se rellena en Cooperativo (D1); en Versus la custodia el anfitrión. */
export const CaseDtoZ = z.object({
  seed: z.number().int(),
  rulesVersion: z.literal(RULES_VERSION),
  witnesses: z.array(WitnessIdZ).max(2),
  slots: z
    .array(z.object({speaker: SuspectIdZ, statement: StatementZ}))
    .min(3)
    .max(8),
  killers: z.number().int().min(1).max(4),
  liars: z.number().int().min(1).max(4),
  solution: SolutionZ.optional(),
});
export type CaseDto = z.infer<typeof CaseDtoZ>;

export const LinkZ = z.enum(['connecting', 'ok', 'degraded', 'reconnecting', 'left']);
export type LinkState = z.infer<typeof LinkZ>;
export const PlayerInfoZ = z.object({
  id: z.string().max(64),
  name: z.string().max(24),
  isHost: z.boolean(),
  link: LinkZ,
  rttMs: z.number().nonnegative().optional(),
  ready: z.boolean(),
  submitted: z.boolean(),
});
export type PlayerInfo = z.infer<typeof PlayerInfoZ>;

export const ModeZ = z.enum(['cooperativo', 'versus']);
export type NetMode = z.infer<typeof ModeZ>;

const Envelope = z.object({v: z.literal(PROTOCOL_VERSION), seq: z.number().int().nonnegative()});

export const ClientMsgZ = z.discriminatedUnion('t', [
  Envelope.extend({
    t: z.literal('HELLO'),
    clientId: z.string().min(1).max(64),
    name: z.string().min(1).max(24),
    mode: ModeZ,
    rulesVersion: z.number(),
    proof: z.string().max(128),
    resumeToken: z.string().max(64).optional(),
  }),
  Envelope.extend({t: z.literal('PING'), t0: z.number()}),
  Envelope.extend({t: z.literal('READY'), ready: z.boolean()}),
  Envelope.extend({
    t: z.literal('SUBMIT'),
    killers: z.array(SuspectIdZ).max(8),
    liars: z.array(SuspectIdZ).max(8),
    elapsedMs: z.number().nonnegative(),
  }),
  Envelope.extend({t: z.literal('BYE')}),
]);
export type ClientMsg = z.infer<typeof ClientMsgZ>;

export const RejectCodeZ = z.enum([
  'BAD_PROOF',
  'BAD_RULES',
  'MODE_MISMATCH',
  'ROOM_FULL',
  'ALREADY_STARTED',
  'EXPIRED',
  'BLOCKED',
]);
export type RejectCode = z.infer<typeof RejectCodeZ>;

export const BoardRowZ = z.object({
  id: z.string(),
  name: z.string(),
  correct: z.boolean(),
  elapsedMs: z.number(),
});
export type BoardRow = z.infer<typeof BoardRowZ>;

export const HostMsgZ = z.discriminatedUnion('t', [
  Envelope.extend({t: z.literal('CHALLENGE'), salt: z.string().max(64)}),
  Envelope.extend({
    t: z.literal('WELCOME'),
    you: z.string(),
    resumeToken: z.string(),
    roster: z.array(PlayerInfoZ).max(8),
    caseDto: CaseDtoZ,
    started: z.boolean(),
    startAtHostMs: z.number().optional(),
    hostNowMs: z.number(),
  }),
  Envelope.extend({t: z.literal('REJECT'), code: RejectCodeZ}),
  Envelope.extend({t: z.literal('ROSTER'), players: z.array(PlayerInfoZ).max(8)}),
  Envelope.extend({t: z.literal('PONG'), t0: z.number(), t1: z.number(), t2: z.number()}),
  Envelope.extend({t: z.literal('START'), atHostMs: z.number()}),
  Envelope.extend({t: z.literal('OPPONENT_SUBMITTED'), playerId: z.string(), name: z.string()}),
  Envelope.extend({
    t: z.literal('RESULT'),
    winnerId: z.string().nullable(),
    board: z.array(BoardRowZ).max(8),
    truth: SolutionZ,
  }),
]);
export type HostMsg = z.infer<typeof HostMsgZ>;

/** Prueba de conocimiento del código sin enviarlo: HMAC-SHA256(código, salt‖clientId). */
export const proofOf = (code: string, salt: string, clientId: string): string =>
  bytesToHex(hmac(sha256, utf8ToBytes(code), utf8ToBytes(salt + clientId)));
