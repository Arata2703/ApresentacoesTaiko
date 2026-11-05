import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../../App'

function send(element: HTMLElement, type: string, y: number) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: 100,
    clientY: y,
    button: 0,
  })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  fireEvent(element, event)
}
describe('arrastar slides', () => {
  it('mantém o mesmo indicador entre slides ao passar da base de um para o topo do próximo', async () => {
    render(<App />)
    const add = screen.getByRole('button', { name: '+ Adicionar música' })
    await userEvent.click(add)
    await userEvent.click(add)
    const side = screen.getByRole('complementary', {
      name: 'Páginas da apresentação',
    })
    const slides = within(side).getAllByRole('button', { name: /Abrir mapa/ })
    slides.forEach((button, index) =>
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 200,
        top: 100 + 100 * index,
        height: 80,
      } as DOMRect),
    )
    try {
      send(slides[0]!, 'pointerdown', 110)
      send(slides[0]!, 'pointermove', 275)
      const indicator = screen.getByRole('separator', {
        name: 'Posição de inserção',
      })
      expect(slides[2]).toContainElement(indicator)
      send(slides[0]!, 'pointermove', 305)
      expect(
        screen.getByRole('separator', { name: 'Posição de inserção' }),
      ).toBe(indicator)
      expect(slides[2]).toContainElement(indicator)
      send(slides[0]!, 'pointercancel', 305)
      expect(screen.queryByRole('separator')).not.toBeInTheDocument()
    } finally {
      vi.restoreAllMocks()
    }
  })
  it('insere em outra posição sem mudar o selecionado, cancela e mantém alternativa por teclado', async () => {
    render(<App />)
    const add = screen.getByRole('button', { name: '+ Adicionar música' })
    await userEvent.click(add)
    await userEvent.click(add)
    const side = screen.getByRole('complementary', {
      name: 'Páginas da apresentação',
    })
    const names = () =>
      within(side)
        .getAllByRole('button', { name: /Abrir mapa/ })
        .map((el) => el.getAttribute('aria-label'))
    const first = screen.getByRole('button', {
      name: 'Abrir mapa Primeira música',
    })
    within(side)
      .getAllByRole('button', { name: /Abrir mapa/ })
      .forEach((button, index) => {
        vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
          left: 0,
          right: 200,
          top: 100 + index * 100,
          height: 80,
        } as DOMRect)
      })
    try {
      send(first, 'pointerdown', 100)
      send(first, 'pointermove', 375)
      send(first, 'pointerup', 375)
      fireEvent.click(first, { detail: 1 })
      expect(names()).toEqual([
        'Abrir mapa Música 2',
        'Abrir mapa Música 3',
        'Abrir mapa Primeira música',
      ])
      expect(first).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByLabelText('Nome da música')).toHaveValue(
        'Primeira música',
      )
      send(first, 'pointerdown', 300)
      send(first, 'pointermove', 100)
      send(first, 'pointercancel', 100)
      expect(names()[2]).toBe('Abrir mapa Primeira música')
      send(first, 'pointerdown', 300)
      send(first, 'pointermove', 100)
      send(first, 'lostpointercapture', 100)
      await userEvent.click(first)
      await userEvent.keyboard(
        '{ArrowRight}{Escape}{Alt>}{ArrowUp}{ArrowDown}{/Alt}',
      )
      expect(names()[2]).toBe('Abrir mapa Primeira música')
    } finally {
      vi.restoreAllMocks()
    }
  })
})
