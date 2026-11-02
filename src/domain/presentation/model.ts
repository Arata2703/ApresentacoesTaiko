import type { InstrumentKind } from '../stage'

export type BaseId =
  | 'okedo-suwaridai'
  | 'okedo-naname'
  | 'okedo-eitetsu'
  | 'okedo-tachi'
  | 'shime-suwaridai'
  | 'shime-tachidai'
  | 'nagado-suwaridai'
  | 'nagado-tachi'
export interface Person {
  readonly id: string
  readonly name: string
}
export interface StageDimensions {
  readonly width: number
  readonly depth: number
}
export interface Position {
  readonly x: number
  readonly y: number
}
export interface MapInstrument {
  readonly id: string
  readonly kind: InstrumentKind
  readonly baseId: BaseId | null
  readonly playerIds: readonly string[]
  readonly position: Position
  readonly rotation: number
}
export interface MusicMap {
  readonly id: string
  readonly title: string
  readonly stage: StageDimensions
  readonly instruments: readonly MapInstrument[]
}
export interface TextTransition {
  readonly id: string
  readonly tsunagiName: string
  readonly instructions: string
  readonly participantIds: readonly string[]
  readonly needsReview: boolean
}
export interface ManualMaterial {
  readonly id: string
  readonly name: string
  readonly quantity: number
}
export type SequenceItem =
  | { readonly kind: 'map'; readonly id: string }
  | { readonly kind: 'transition'; readonly id: string }
export interface Presentation {
  readonly id: string
  readonly title: string
  readonly people: readonly Person[]
  /** Membership is separate from identity, so removing a roster entry keeps assignments. */
  readonly rosterIds: readonly string[]
  readonly maps: readonly MusicMap[]
  readonly transitions: readonly TextTransition[]
  readonly sequence: readonly SequenceItem[]
  readonly materials: readonly ManualMaterial[]
}
