import styles from '../editor.module.css'

interface Props {
  song: string
  onSongChange: (song: string) => void
}
export function MapHeading(props: Props) {
  const { song, onSongChange } = props
  return (
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
          onChange={(event) => onSongChange(event.target.value)}
          maxLength={80}
        />
      </div>
      <span className={styles.mapBadge}>Mapa de palco</span>
    </div>
  )
}
