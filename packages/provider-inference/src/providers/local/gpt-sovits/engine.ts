export interface GptSovitsOptions {
  promptLanguage: string
  promptText: string
  refAudioPath: string
  speedFactor: number
  temperature: number
  textLanguage: string
}

export interface GptSovitsRequestOptions {
  fetch?: typeof globalThis.fetch
  signal?: AbortSignal
}

/** Send the GPT-SoVITS API v2 request and return its WAV response. */
export async function synthesizeWithGptSovits(
  baseUrl: string,
  text: string,
  options: GptSovitsOptions,
  requestOptions?: GptSovitsRequestOptions,
): Promise<ArrayBuffer> {
  let endpoint: URL
  try {
    const normalizedBaseUrl = baseUrl.trim().endsWith('/') ? baseUrl.trim() : `${baseUrl.trim()}/`
    endpoint = new URL('tts', normalizedBaseUrl)
    if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:')
      throw new Error('unsupported protocol')
  }
  catch {
    throw new Error('GPT-SoVITS Base URL must be an absolute http:// or https:// address.')
  }

  const response = await (requestOptions?.fetch ?? globalThis.fetch)(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: requestOptions?.signal,
    redirect: 'error',
    body: JSON.stringify({
      ref_audio_path: options.refAudioPath,
      prompt_text: options.promptText,
      prompt_lang: options.promptLanguage,
      text,
      text_lang: options.textLanguage,
      media_type: 'wav',
      streaming_mode: false,
      // AIRI supplies bounded speech chunks. Keep the backend from splitting them again.
      text_split_method: 'cut0',
      fragment_interval: 0.08,
      batch_size: 1,
      temperature: options.temperature,
      top_k: 15,
      top_p: 1,
      speed_factor: options.speedFactor,
    }),
  })

  if (!response.ok)
    throw new Error(`GPT-SoVITS returned HTTP ${response.status} ${response.statusText}. Check the local service and request settings.`)

  return await response.arrayBuffer()
}
