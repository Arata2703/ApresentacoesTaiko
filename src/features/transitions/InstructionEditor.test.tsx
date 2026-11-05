import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InstructionEditor } from './InstructionEditor'

function Editor() {
  const [value, setValue] = useState('<p>Mover</p>')
  return <InstructionEditor value={value} format="html" onChange={setValue} />
}
function select(field: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(field)
  window.getSelection()!.removeAllRanges()
  window.getSelection()!.addRange(range)
  fireEvent(document, new Event('selectionchange'))
}
function nativeCommands() {
  // jsdom has selection but no native rich-text engine. Assert the browser boundary;
  // actual formatting, caret, typing and undo are verified in the real browser.
  const command = vi.fn(() => true)
  Object.defineProperty(document, 'execCommand', {
    value: command,
    configurable: true,
  })
  Object.defineProperty(document, 'queryCommandState', {
    value: (name: string) => name === 'bold',
    configurable: true,
  })
  return command
}
afterEach(() => {
  Reflect.deleteProperty(document, 'execCommand')
  Reflect.deleteProperty(document, 'queryCommandState')
})

describe('editor único com formatação direta', () => {
  it('usa a seleção atual mesmo antes do evento selectionchange atualizar a seleção lembrada', async () => {
    const command = nativeCommands()
    render(<InstructionEditor value="Primeiro Segundo" onChange={() => {}} />)
    const field = screen.getByRole('textbox')
    select(field)
    const range = document.createRange()
    range.setStart(field.firstChild!.firstChild!, 9)
    range.setEnd(field.firstChild!.firstChild!, 16)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    command.mockImplementation(() => {
      expect(window.getSelection()!.toString()).toBe('Segundo')
      return true
    })
    await userEvent.click(screen.getByRole('button', { name: 'Negrito' }))
    expect(command).toHaveBeenCalled()
  })
  it('mostra formatação no próprio texto e publica conteúdo editado sem reconstruir o cursor', () => {
    const changed = vi.fn()
    const view = render(
      <InstructionEditor value="**Mover** e *aguardar*" onChange={changed} />,
    )
    const field = screen.getByRole('textbox')
    expect(field.querySelector('strong')).toHaveTextContent('Mover')
    expect(field.querySelector('em')).toHaveTextContent('aguardar')
    expect(
      screen.queryByRole('button', { name: 'Prévia' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Usar etapas numeradas' }),
    ).not.toBeInTheDocument()
    field.innerHTML = '<p><b>Novo</b> <i>texto</i></p>'
    select(field)
    fireEvent.input(field)
    expect(changed).toHaveBeenCalledWith(
      '<p><strong>Novo</strong> <em>texto</em></p>',
    )
    const paragraph = field.firstChild
    view.rerender(
      <InstructionEditor
        value={changed.mock.calls[0]![0]}
        format="html"
        onChange={changed}
      />,
    )
    expect(field.firstChild).toBe(paragraph)
    expect(window.getSelection()!.toString()).toBe('Novo texto')
    view.rerender(<InstructionEditor value="Outro" onChange={changed} />)
    expect(field).toHaveTextContent('Outro')
  })
  it('preserva seleção ao acionar ferramentas e prioriza os atalhos somente dentro do editor', async () => {
    const command = nativeCommands()
    const user = userEvent.setup()
    render(<Editor />)
    const field = screen.getByRole('textbox')
    select(field)
    expect(screen.getByRole('button', { name: 'Negrito' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    for (const [label, name] of [
      ['Negrito', 'bold'],
      ['Itálico', 'italic'],
      ['Lista com marcadores', 'insertUnorderedList'],
      ['Lista numerada', 'insertOrderedList'],
    ]) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(command).toHaveBeenLastCalledWith(name, false, undefined)
      expect(window.getSelection()!.toString()).toBe('Mover')
      expect(field).toHaveFocus()
    }
    for (const key of ['b', 'B', 'i']) {
      expect(
        fireEvent.keyDown(field, { key, ctrlKey: true, cancelable: true }),
      ).toBe(false)
      expect(command).toHaveBeenLastCalledWith(
        key === 'i' ? 'italic' : 'bold',
        false,
        undefined,
      )
    }
    expect(
      fireEvent.keyDown(field, { key: 'n', ctrlKey: true, cancelable: true }),
    ).toBe(true)
    expect(
      fireEvent.keyDown(field, { key: 'i', metaKey: true, cancelable: true }),
    ).toBe(false)
    expect(
      fireEvent.keyDown(field, {
        key: 'n',
        ctrlKey: true,
        altKey: true,
        cancelable: true,
      }),
    ).toBe(true)
    expect(
      fireEvent.keyDown(field, { key: 'x', ctrlKey: true, cancelable: true }),
    ).toBe(true)
    expect(fireEvent.keyDown(field, { key: 'a', cancelable: true })).toBe(true)
    expect(
      fireEvent.keyDown(document.body, {
        key: 'n',
        ctrlKey: true,
        cancelable: true,
      }),
    ).toBe(true)
    window.getSelection()!.removeAllRanges()
    fireEvent(document, new Event('selectionchange'))
    await user.click(screen.getByRole('button', { name: 'Negrito' }))
  })
  it('limpa conteúdo colado e deixa o navegador inserir texto simples e HTML permitido', async () => {
    const command = nativeCommands()
    render(<Editor />)
    const field = screen.getByRole('textbox')
    fireEvent.paste(field, {
      clipboardData: {
        getData: (type: string) =>
          type === 'text/html'
            ? '<b onclick="bad()">Mover</b><img src=x onerror="bad()">'
            : '',
      },
    })
    expect(command).toHaveBeenLastCalledWith(
      'insertHTML',
      false,
      '<strong>Mover</strong>',
    )
    fireEvent.paste(field, {
      clipboardData: {
        getData: (type: string) => (type === 'text/plain' ? 'A\nB' : ''),
      },
    })
    expect(command).toHaveBeenLastCalledWith('insertText', false, 'A\nB')
    expect(fireEvent.drop(field, { cancelable: true })).toBe(false)
    select(document.body)
    fireEvent(document, new Event('selectionchange'))
    await userEvent.click(screen.getByRole('button', { name: 'Itálico' }))
  })
})
