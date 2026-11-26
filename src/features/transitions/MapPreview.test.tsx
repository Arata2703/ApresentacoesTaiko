import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { it, expect, vi } from 'vitest'
import { presentationFixture } from '../../test/presentationFixture'
import { addMapInstrument } from '../../domain/presentation/maps'
import { changeKumi, createKumi } from '../../domain/presentation/kumi'
import { projectMap } from '../editor/editorProjection'
import { MapPreview } from './MapPreview'
it('prévia da transição mostra somente o integrante do Kumi e abre seu mapa', async () => {
  const p = changeKumi(
    createKumi(
      addMapInstrument(presentationFixture(), 'a', 's', 'shime'),
      'a',
      'k',
      ['drum', 's'],
    ),
    'a',
    'k',
    { name: 'Dupla' },
  )
  const onOpen = vi.fn()
  render(
    <MapPreview
      map={projectMap(p, 'a')}
      label="Antes"
      empty="Sem mapa"
      onOpen={onOpen}
    />,
  )
  expect(screen.queryByText('Dupla')).not.toBeInTheDocument()
  expect(screen.getAllByText('Ana/João')).toHaveLength(1)
  await userEvent.click(screen.getByRole('button'))
  expect(onOpen).toHaveBeenCalledOnce()
})
