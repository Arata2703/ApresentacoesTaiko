import { PresentationHeader } from './components/PresentationHeader'
import { PresentationSidebar } from './components/PresentationSidebar'
import { MapHeading } from './components/MapHeading'
import { MapFiles } from './components/MapFiles'
import { InstrumentCatalog } from './components/InstrumentCatalog'
import { StageMap } from './components/StageMap'
import { InstrumentProperties } from './components/InstrumentProperties'
import { EditorFooter } from './components/EditorFooter'
import { useStageEditor } from './useStageEditor'
import styles from './editor.module.css'
import { useState } from 'react'
import { MaterialsPage } from '../materials/MaterialsPage'
import { PeoplePage } from '../people/PeoplePage'
import { peopleActions } from '../people/peopleActions'
import { StageSettings } from './components/StageSettings'
import { MusicActions } from './components/MusicActions'
import { ShowOrder } from './components/ShowOrder'
import { useTransitions } from '../transitions/useTransitions'
import { TransitionEditor } from '../transitions/TransitionEditor'
import { PlayerRegistrationDialog } from '../people/PlayerRegistrationDialog'
import type { PlayerReference } from '../people/playerDraft'

export function EditorPage() {
  const editor = useStageEditor()
  const [view, setView] = useState<'slides' | 'people' | 'materials'>('slides')
  const [pendingPlayers, setPendingPlayers] = useState<{
    instrumentId: string
    players: readonly PlayerReference[]
    names: string[]
  } | null>(null)
  const people = peopleActions(editor.updatePresentation)
  const transitions = useTransitions(
    editor.presentation,
    editor.updatePresentation,
  )
  const selectedSlideId =
    view !== 'slides'
      ? undefined
      : (transitions.selected?.id ?? editor.activeMapId ?? undefined)
  function openMap(id: string) {
    transitions.close()
    editor.selectMap(id)
    setView('slides')
  }

  return (
    <div className={styles.app}>
      <a className={styles.skip} href="#workspace">
        Ir para o mapa de palco
      </a>
      <PresentationHeader
        title={editor.title}
        onTitleChange={editor.setTitle}
      />
      <div className={styles.layout}>
        <PresentationSidebar
          onAdd={() => {
            transitions.close()
            editor.addMusic(selectedSlideId)
            setView('slides')
          }}
          onAddTransition={() => {
            transitions.create(selectedSlideId)
            setView('slides')
          }}
          onMove={editor.moveSlide}
          onReorder={editor.reorderSlide}
          onReview={transitions.review}
          activeTransitionId={transitions.selected?.id ?? null}
          onTransition={(id) => {
            transitions.open(id)
            setView('slides')
          }}
          view={view}
          onMaterials={() => setView('materials')}
          onPeople={() => setView('people')}
          presentation={editor.presentation}
          activeMapId={editor.activeMapId}
          onSelect={(id) => {
            openMap(id)
          }}
        />
        <main className={styles.workspace} id="workspace">
          <MapFiles
            presentation={editor.presentation}
            page={
              view === 'materials' ||
              (view === 'slides' && transitions.selected)
                ? null
                : editor.page
            }
            onOpen={(presentation) => {
              setPendingPlayers(null)
              editor.openPresentation(presentation)
              transitions.close()
              setView('slides')
            }}
          />
          {pendingPlayers && (
            <PlayerRegistrationDialog
              names={pendingPlayers.names}
              onCancel={() => setPendingPlayers(null)}
              onConfirm={() => {
                editor.commitPlayers(
                  pendingPlayers.instrumentId,
                  pendingPlayers.players,
                )
                setPendingPlayers(null)
              }}
            />
          )}
          <div className={styles.fileActions} aria-live="polite">
            <p>{editor.cache.message}</p>
            {editor.cache.blocked && (
              <button onClick={editor.cache.enable}>
                Substituir cópia local pelos dados atuais
              </button>
            )}
          </div>
          {view === 'slides' && (
            <ShowOrder
              presentation={editor.presentation}
              onAddEntry={() => transitions.create(null)}
            />
          )}
          {view === 'people' ? (
            <PeoplePage
              presentation={editor.presentation}
              actions={people}
              onBack={() => setView('slides')}
            />
          ) : view === 'materials' ? (
            <MaterialsPage
              presentation={editor.presentation}
              onUpdate={editor.updatePresentation}
              onBack={() => setView('slides')}
            />
          ) : transitions.selected ? (
            <TransitionEditor
              key={transitions.selected.id}
              presentation={editor.presentation}
              transition={transitions.selected}
              onChange={transitions.change}
              onReview={transitions.review}
              onRemove={transitions.remove}
              onOpenMap={openMap}
            />
          ) : editor.page ? (
            <>
              <MapHeading song={editor.song} onSongChange={editor.setSong} />
              <MusicActions
                key={editor.activeMapId}
                song={editor.song}
                onDuplicate={editor.duplicateMusic}
                onRemove={editor.removeMusic}
              />
              <StageSettings
                key={`${editor.activeMapId}:${editor.page.stage.width}:${editor.page.stage.depth}`}
                stage={editor.page.stage}
                onApply={editor.resizeStage}
              />
              <div className={styles.editor}>
                <InstrumentCatalog onAdd={editor.addInstrument} />
                <StageMap
                  people={editor.presentation.people}
                  onCommitPlayers={(instrumentId, players) => {
                    const names = [
                      ...new Set(
                        players.flatMap((player) =>
                          'name' in player ? [player.name] : [],
                        ),
                      ),
                    ]
                    if (names.length)
                      setPendingPlayers({ instrumentId, players, names })
                    else editor.commitPlayers(instrumentId, players)
                  }}
                  stage={editor.page.stage}
                  instruments={editor.instruments}
                  selectedId={editor.selectedId}
                  onSelect={editor.selectInstrument}
                  onAdd={editor.addInstrument}
                  onMove={editor.moveInstrument}
                />
                <InstrumentProperties
                  onBaseChange={editor.changeBase}
                  people={editor.presentation.people}
                  onAssign={editor.assignPlayers}
                  onManage={() => setView('people')}
                  stage={editor.page.stage}
                  selected={editor.selected}
                  onChange={editor.changeSelected}
                  onRemove={editor.removeSelected}
                />
              </div>
            </>
          ) : (
            <section>
              <h1>Apresentação sem mapas</h1>
              <p>Crie o primeiro mapa para começar a formação.</p>
              <button onClick={editor.createFirstMap}>
                Criar primeiro mapa
              </button>
            </section>
          )}
          <EditorFooter message={editor.message} />
        </main>
      </div>
    </div>
  )
}
