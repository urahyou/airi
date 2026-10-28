import JSZip from 'jszip'

import { describe, expect, it } from 'vitest'

import { readLegacyModelFiles } from './legacy-live2d'

describe('legacy Live2D archives', () => {
  it('preserves paths for a Cubism 2 model and leaves Cubism 4 to the existing loader', async () => {
    const old = new JSZip()
    old.file('character/model.json', JSON.stringify({ model: 'avatar.moc', textures: ['texture.png'] }))
    old.file('character/avatar.moc', new Uint8Array([109, 111, 99]))
    old.file('character/texture.png', new Uint8Array([1]))
    const files = await readLegacyModelFiles(new Blob([await old.generateAsync({ type: 'arraybuffer' })]))
    expect(files?.map(file => file.webkitRelativePath).sort()).toEqual(['character/avatar.moc', 'character/model.json', 'character/texture.png'])

    const modern = new JSZip()
    modern.file('avatar.model3.json', JSON.stringify({ Version: 3, FileReferences: { Moc: 'avatar.moc3' } }))
    expect(await readLegacyModelFiles(new Blob([await modern.generateAsync({ type: 'arraybuffer' })]))).toBeUndefined()
  })
})
