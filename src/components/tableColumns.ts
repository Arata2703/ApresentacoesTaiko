import type { ReactNode } from 'react'

interface BaseColumn {
  id: string
  title: string
}

interface EditableColumn<Row, Value> extends BaseColumn {
  kind: 'editable'
  label: (row: Row, index: number) => string
  inputLabel?: (row: Row, index: number) => string
  value: (row: Row) => Value
  validate: (value: string, row: Row) => string
  save: (row: Row, value: Value) => void
}

export interface TextColumn<Row> extends EditableColumn<Row, string> {
  input: 'text'
  maxLength?: number
}

export interface NumberColumn<Row> extends EditableColumn<Row, number> {
  input: 'number'
  min: number
}

export type Column<Row> =
  | TextColumn<Row>
  | NumberColumn<Row>
  | (BaseColumn & { kind: 'read'; value: (row: Row) => ReactNode })
  | {
      id: string
      kind: 'remove'
      label: (row: Row, index: number) => string
      confirmation: (row: Row) => ReactNode
      remove: (row: Row) => void
    }
