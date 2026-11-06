import { useState } from 'react'
import { ConfirmationPopup } from './ConfirmationPopup'
import { EditableCell } from './EditableCell'
import type { Column } from './tableColumns'
import styles from './dataTable.module.css'

interface Props<Row> {
  rows: readonly Row[]
  columns: readonly Column<Row>[]
  rowId: (row: Row) => string
  rowLabel: (row: Row, index: number) => string
}

export function DataTable<Row>({ rows, columns, rowId, rowLabel }: Props<Row>) {
  const [confirmation, setConfirmation] = useState<{
    rowId: string
    columnId: string
  } | null>(null)
  const row =
    confirmation && rows.find((row) => rowId(row) === confirmation.rowId)
  const column =
    confirmation &&
    columns.find((column) => column.id === confirmation.columnId)
  const close = () => setConfirmation(null)

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) =>
              column.kind === 'remove' ? (
                <th
                  key={column.id}
                  scope="col"
                  className={styles.remove}
                  aria-label="Remoção"
                />
              ) : (
                <th
                  key={column.id}
                  scope="col"
                  className={
                    column.kind === 'editable' && column.input === 'number'
                      ? styles.number
                      : undefined
                  }
                >
                  {column.title}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowId(row)} aria-label={rowLabel(row, index)}>
              {columns.map((column) => {
                switch (column.kind) {
                  case 'read':
                    return <td key={column.id}>{column.value(row)}</td>
                  case 'editable':
                    return (
                      <EditableCell
                        key={column.id}
                        column={column}
                        row={row}
                        index={index}
                      />
                    )
                  case 'remove':
                    return (
                      <td key={column.id} className={styles.remove}>
                        <button
                          type="button"
                          className={styles.icon}
                          aria-label={column.label(row, index)}
                          onClick={() =>
                            setConfirmation({
                              rowId: rowId(row),
                              columnId: column.id,
                            })
                          }
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6" />
                          </svg>
                        </button>
                      </td>
                    )
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {row && column?.kind === 'remove' && (
        <ConfirmationPopup
          title={column.label(row, rows.indexOf(row))}
          dismissActionIndex={0}
          actions={[
            { label: 'Cancelar', onClick: close },
            {
              label: 'Confirmar',
              onClick: () => {
                column.remove(row)
                close()
              },
            },
          ]}
        >
          {column.confirmation(row)}
        </ConfirmationPopup>
      )}
    </div>
  )
}
