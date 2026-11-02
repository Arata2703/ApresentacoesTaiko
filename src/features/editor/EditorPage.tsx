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

export function EditorPage() {
  const editor = useStageEditor()

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
        <PresentationSidebar song={editor.song} />
        <main className={styles.workspace} id="workspace">
          <MapFiles map={editor} onOpen={editor.openMap} />
          <MapHeading song={editor.song} onSongChange={editor.setSong} />
          <div className={styles.editor}>
            <InstrumentCatalog onAdd={editor.addInstrument} />
            <StageMap
              instruments={editor.instruments}
              selectedId={editor.selectedId}
              onSelect={editor.selectInstrument}
              onAdd={editor.addInstrument}
              onMove={editor.moveInstrument}
            />
            <InstrumentProperties
              selected={editor.selected}
              onChange={editor.changeSelected}
              onRemove={editor.removeSelected}
            />
          </div>
          <EditorFooter message={editor.message} />
        </main>
      </div>
    </div>
  )
}
