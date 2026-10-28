import type { Cubism2InternalModel, Live2DModel } from 'pixi-live2d-display/cubism2'

import JSZip from 'jszip'

import { decodeZipFileName } from './decode-zip-filename'

/** Extracts a Cubism 2 archive with paths intact for the legacy FileLoader. */
export async function readLegacyModelFiles(source: Blob): Promise<File[] | undefined> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(await source.arrayBuffer(), { decodeFileName: decodeZipFileName })
  }
  catch {
    return undefined
  }
  const entries = Object.entries(zip.files).filter(([path, entry]) => !entry.dir && !path.split('/').some(part => part === '__MACOSX' || part.startsWith('._')))
  if (entries.some(([path]) => path.toLowerCase().endsWith('.model3.json')))
    return undefined
  const entry = entries.find(([path]) => /(?:^|\/)model\.json$/i.test(path) || path.toLowerCase().endsWith('.model.json'))
  if (!entry)
    return undefined
  const settings: unknown = JSON.parse(await entry[1].async('text'))
  if (!settings || typeof settings !== 'object' || !('model' in settings) || typeof settings.model !== 'string' || !settings.model.toLowerCase().endsWith('.moc'))
    return undefined
  return Promise.all(entries.map(async ([path, item]) => {
    const file = new File([await item.async('arraybuffer')], path.split('/').pop()!)
    Object.defineProperty(file, 'webkitRelativePath', { value: path })
    return file
  }))
}

let legacyRuntime: Promise<typeof import('pixi-live2d-display/cubism2')> | undefined

/** Loads the Cubism 2 core only when a legacy archive is selected. */
export function loadLegacyRuntime() {
  legacyRuntime ??= (async () => {
    const { default: coreUrl } = await import('../assets/live2d-cubism2.js?url')
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = coreUrl
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Could not load the Cubism 2 core'))
      document.head.append(script)
    })
    const runtime = await import('pixi-live2d-display/cubism2')
    const { Ticker } = await import('@pixi/ticker')
    runtime.Live2DModel.registerTicker(Ticker)
    return runtime
  })().catch((error: unknown) => {
    legacyRuntime = undefined
    throw error
  })
  return legacyRuntime
}

/** Creates a model from the already extracted files and transfers their ownership to the renderer. */
export async function createLegacyModel(files: File[]): Promise<Live2DModel<Cubism2InternalModel>> {
  const { Live2DFactory, Live2DModel } = await loadLegacyRuntime()
  const model = new Live2DModel<Cubism2InternalModel>()
  await Live2DFactory.setupLive2DModel(model, files, { autoInteract: false })
  return model
}
