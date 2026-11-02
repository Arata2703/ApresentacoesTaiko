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
          {peopleView ? (
            <PeoplePage presentation={editor.presentation} actions={people} />
          ) : editor.page ? (
            <>
              <MapHeading song={editor.song} onSongChange={editor.setSong} />
              <div className={styles.editor}>
                <InstrumentCatalog onAdd={editor.addInstrument} />
                <StageMap
                  stage={editor.page.stage}
                  instruments={editor.instruments}
                  selectedId={editor.selectedId}
                  onSelect={editor.selectInstrument}
                  onAdd={editor.addInstrument}
                  onMove={editor.moveInstrument}
                />
                <InstrumentProperties
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
