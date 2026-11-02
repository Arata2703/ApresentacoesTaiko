import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  catalog,
  createInstrument,
  getInstrumentType,
  stageSize,
  updateInstrument,
  type InstrumentKind,
  type StageInstrument,
} from './domain/stage'
import styles from './App.module.css'

function InstrumentSymbol({
  kind,
  small = false,
}: {
  kind: InstrumentKind
  small?: boolean
}) {
  const type = getInstrumentType(kind)
  return (
    <span
      aria-hidden="true"
      className={`${styles.symbol} ${styles[type.appearance]} ${small ? styles.smallSymbol : ''} ${kind === 'oodaiko' ? styles.largeDrum : ''}`}
    >
      <span />
    </span>
  )
}

export default function App() {
  const [title, setTitle] = useState('Minha apresentação')
  const [song, setSong] = useState('Primeira música')
  const [instruments, setInstruments] = useState<StageInstrument[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState(
    'Escolha um instrumento no catálogo para começar.',
  )
  const selected = instruments.find((item) => item.id === selectedId)
  const selectedType = selected && getInstrumentType(selected.kind)

  function addInstrument(kind: InstrumentKind) {
    const id = crypto.randomUUID()
    setInstruments((current) => [
      ...current,
      createInstrument(kind, id, current.length),
    ])
    setSelectedId(id)
    setMessage(`${getInstrumentType(kind).name} adicionado ao palco.`)
  }
  function changeSelected(changes: Parameters<typeof updateInstrument>[2]) {
    if (selectedId)
      setInstruments((current) =>
        updateInstrument(current, selectedId, changes),
      )
  }
  function moveWithKeyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    item: StageInstrument,
  ) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-0.1, 0],
      ArrowRight: [0.1, 0],
      ArrowUp: [0, -0.1],
      ArrowDown: [0, 0.1],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    setSelectedId(item.id)
    setInstruments((current) =>
      updateInstrument(current, item.id, {
        x: item.x + move[0],
        y: item.y + move[1],
      }),
    )
  }

  return (
    <div className={styles.app}>
      <a className={styles.skip} href="#workspace">
        Ir para o mapa de palco
      </a>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            打
          </span>
          <span>
            taiko<span className={styles.brandDivider}>/</span>palco
          </span>
        </div>
        <div className={styles.projectHeading}>
          <label className={styles.srOnly} htmlFor="presentation-title">
            Nome da apresentação
          </label>
          <input
            id="presentation-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
          />
          <span className={styles.localLabel}>
            <span /> Sessão local · ainda sem salvamento
          </span>
        </div>
        <span className={styles.version}>PRIMEIRA ETAPA</span>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Páginas da apresentação">
          <div className={styles.sidebarHeading}>
            <span className={styles.eyebrow}>APRESENTAÇÃO</span>
            <span className={styles.pageCount}>01</span>
          </div>
          <div className={styles.pageItem} aria-current="page">
            <div className={styles.miniMap} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div>
              <span className={styles.pageNumber}>01 · MAPA DE PALCO</span>
              <strong>{song || 'Música sem título'}</strong>
            </div>
          </div>
          <div className={styles.sidebarNote}>
            <span className={styles.noteIcon} aria-hidden="true">
              ↗
            </span>
            <p>
              Um bom espetáculo
              <br />
              começa no planejamento.
            </p>
          </div>
          <div className={styles.scopeNote}>
            Novas músicas, transições e exportação chegam nas próximas etapas.
          </div>
        </aside>

        <main className={styles.workspace} id="workspace">
          <div className={styles.workspaceHeading}>
            <div>
              <p className={styles.eyebrow}>MONTE A SUA FORMAÇÃO</p>
              <label className={styles.srOnly} htmlFor="song-title">
                Nome da música
              </label>
              <input
                id="song-title"
                className={styles.songTitle}
                value={song}
                onChange={(event) => setSong(event.target.value)}
                maxLength={80}
              />
            </div>
            <span className={styles.mapBadge}>Mapa de palco</span>
          </div>

          <div className={styles.editor}>
            <section className={styles.catalog} aria-labelledby="catalog-title">
              <div className={styles.catalogHeading}>
                <h2 id="catalog-title">Instrumentos</h2>
                <p>Clique para adicionar</p>
              </div>
              <div className={styles.catalogItems}>
                {catalog.map((item) => (
                  <button
                    key={item.kind}
                    className={styles.catalogItem}
                    onClick={() => addInstrument(item.kind)}
                    aria-label={`Adicionar ${item.name}`}
                  >
                    <InstrumentSymbol kind={item.kind} small />
                    <span>{item.name}</span>
                    <span className={styles.addSign} aria-hidden="true">
                      +
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section
              className={styles.stageArea}
              aria-label="Palco de 10 por 6 metros"
            >
              <div className={styles.stageToolbar}>
                <span>VISTA SUPERIOR</span>
                <span>
                  {stageSize.width} × {stageSize.depth} m
                </span>
              </div>
              <div className={styles.audience}>
                <span />
                PLATEIA
                <span />
              </div>
              <div className={styles.stage}>
                <div className={styles.stageBoundary} />
                {instruments.length === 0 && (
                  <div className={styles.emptyStage}>
                    <span className={styles.emptyMark} aria-hidden="true">
                      +
                    </span>
                    <h2>O palco é seu.</h2>
                    <p>
                      Adicione o primeiro instrumento
                      <br />e comece a desenhar sua formação.
                    </p>
                    <button onClick={() => addInstrument('okedo')}>
                      Adicionar um okedo <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                )}
                {instruments.map((item) => {
                  const type = getInstrumentType(item.kind)
                  return (
                    <button
                      key={item.id}
                      className={`${styles.stageInstrument} ${selectedId === item.id ? styles.selected : ''}`}
                      style={
                        {
                          '--x': `${(item.x / stageSize.width) * 100}%`,
                          '--y': `${(item.y / stageSize.depth) * 100}%`,
                          '--rotation': `${item.rotation}deg`,
                        } as CSSProperties
                      }
                      onClick={() => setSelectedId(item.id)}
                      onKeyDown={(event) => moveWithKeyboard(event, item)}
                      aria-pressed={selectedId === item.id}
                      aria-label={`${type.name}${item.player ? `, tocador ${item.player}` : ', sem tocador'}. Use as setas para mover.`}
                    >
                      <span className={styles.rotating}>
                        <InstrumentSymbol kind={item.kind} />
                      </span>
                      <span className={styles.instrumentLabel}>
                        {item.player || type.name}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className={styles.stageBottom}>
                <span>FUNDO DO PALCO</span>
                <span>10 m</span>
              </div>
              <p className={styles.stageHint}>
                {instruments.length
                  ? 'Selecione um instrumento para editar. Use as setas do teclado para mover.'
                  : 'A grade é uma referência de posição. As dimensões dos ícones são ilustrativas.'}
              </p>
            </section>

            <aside
              className={styles.properties}
              aria-labelledby="properties-title"
            >
              <p className={styles.eyebrow}>PROPRIEDADES</p>
              {selected && selectedType ? (
                <>
                  <h2 id="properties-title">{selectedType.name}</h2>
                  <p className={styles.propertyCaption}>
                    Instrumento selecionado
                  </p>
                  <label className={styles.field}>
                    Nome do tocador
                    <input
                      placeholder="Ex.: Ana"
                      value={selected.player}
                      onChange={(event) =>
                        changeSelected({ player: event.target.value })
                      }
                      maxLength={60}
                    />
                  </label>
                  <div className={styles.field}>
                    Base padrão
                    <span className={styles.readOnly}>{selectedType.base}</span>
                  </div>
                  <div className={styles.positionFields}>
                    <label className={styles.field}>
                      Horizontal · m
                      <input
                        type="number"
                        min="0.5"
                        max="9.5"
                        step="0.1"
                        value={Number(selected.x.toFixed(1))}
                        onChange={(event) =>
                          changeSelected({ x: event.target.valueAsNumber })
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      Profundidade · m
                      <input
                        type="number"
                        min="0.6"
                        max="5.4"
                        step="0.1"
                        value={Number(selected.y.toFixed(1))}
                        onChange={(event) =>
                          changeSelected({ y: event.target.valueAsNumber })
                        }
                      />
                    </label>
                  </div>
                  <label className={styles.field}>
                    Rotação{' '}
                    <span className={styles.angle}>{selected.rotation}°</span>
                    <input
                      aria-label="Rotação"
                      type="range"
                      min="0"
                      max="345"
                      step="15"
                      value={selected.rotation}
                      onChange={(event) =>
                        changeSelected({ rotation: event.target.valueAsNumber })
                      }
                    />
                  </label>
                  <button
                    className={styles.removeButton}
                    onClick={() => {
                      setInstruments((current) =>
                        current.filter((item) => item.id !== selected.id),
                      )
                      setSelectedId(null)
                      setMessage(`${selectedType.name} removido.`)
                    }}
                  >
                    Remover instrumento
                  </button>
                </>
              ) : (
                <>
                  <h2 id="properties-title">
                    Cada detalhe
                    <br />
                    no seu lugar.
                  </h2>
                  <div className={styles.selectionSketch} aria-hidden="true">
                    <span />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <p className={styles.propertyCaption}>
                    Selecione um instrumento no palco para definir o tocador, a
                    posição e a rotação.
                  </p>
                </>
              )}
            </aside>
          </div>
          <footer className={styles.footer}>
            <span role="status" aria-live="polite">
              {message}
            </span>
            <span>
              Alterações apenas nesta sessão. Recarregar a página limpa o mapa.
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
