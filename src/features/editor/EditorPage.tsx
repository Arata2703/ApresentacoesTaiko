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
import { PeoplePage } from '../people/PeoplePage'
import { peopleActions } from '../people/peopleActions'
import { StageSettings } from './components/StageSettings'
import { MusicActions } from './components/MusicActions'
import { ShowOrder } from './components/ShowOrder'

export function EditorPage() {
  const editor = useStageEditor()
  const [peopleView, setPeopleView] = useState(false)
  const people = peopleActions(editor.updatePresentation)

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
            editor.addMusic()
            setPeopleView(false)
          }}
          onMove={editor.moveMusic}
          onReorder={editor.reorderMusic}
          peopleView={peopleView}
          onPeople={() => setPeopleView(true)}
          presentation={editor.presentation}
          activeMapId={editor.activeMapId}
          onSelect={(id) => {
            editor.selectMap(id)
            setPeopleView(false)
          }}
        />
        <main className={styles.workspace} id="workspace">
          <MapFiles
            presentation={editor.presentation}
            page={peopleView ? null : editor.page}
            onOpen={(presentation) => {
              editor.openPresentation(presentation)
              setPeopleView(false)
            }}
          />
          <div className={styles.fileActions} aria-live="polite">
            <p>{editor.cache.message}</p>
            {editor.cache.blocked && (
              <button onClick={editor.cache.enable}>
                Substituir cópia local pelos dados atuais
              </button>
            )}
          </div>
          {!peopleView && <ShowOrder presentation={editor.presentation} />}
          {peopleView ? (
            <PeoplePage
              presentation={editor.presentation}
              actions={people}
              onBack={() => setPeopleView(false)}
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
                  onCommitPlayers={editor.commitPlayers}
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
                  onManage={() => setPeopleView(true)}
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
