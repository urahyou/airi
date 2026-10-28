import type { ProviderDefinition, VoiceInfo } from '../../../types'

import { z } from 'zod'

import { defineProvider } from '../../registry'
import { synthesizeWithGptSovits } from './engine'

const providerId = 'gpt-sovits'
const defaultBaseUrl = 'http://127.0.0.1:9880/'
const syntheticModelId = 'default'
const syntheticVoiceId = 'reference-audio'

const voiceSettingsSchema = z.object({
  refAudioPath: z.string().default(''),
  promptText: z.string().default(''),
  promptLanguage: z.string().default('zh'),
  textLanguage: z.string().default('zh'),
  speedFactor: z.number().default(1),
  temperature: z.number().default(0.9),
})

const configSchema = z.object({
  baseUrl: z.string().default(defaultBaseUrl),
  voiceSettings: voiceSettingsSchema.default({
    refAudioPath: '',
    promptText: '',
    promptLanguage: 'zh',
    textLanguage: 'zh',
    speedFactor: 1,
    temperature: 0.9,
  }),
})

type GptSovitsConfig = z.input<typeof configSchema>

export const providerGptSovits: ProviderDefinition<GptSovitsConfig, typeof providerId> = defineProvider<GptSovitsConfig, typeof providerId>({
  id: providerId,
  name: 'GPT-SoVITS',
  nameLocalize: ({ t }) => t('settings.pages.providers.provider.gpt-sovits.title'),
  description: 'Local GPT-SoVITS speech synthesis',
  descriptionLocalize: ({ t }) => t('settings.pages.providers.provider.gpt-sovits.description'),
  tasks: ['text-to-speech'],
  icon: 'i-lobe-icons:speaker',
  createProviderConfig: () => configSchema,
  createProvider(config) {
    return {
      speech: () => ({
        baseURL: 'http://gpt-sovits.invalid/',
        model: syntheticModelId,
        fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
          if (!init?.body || typeof init.body !== 'string')
            throw new Error('Invalid speech request body.')

          const body = JSON.parse(init.body) as { input?: string }
          const voiceSettings = config.voiceSettings ?? {}
          const refAudioPath = voiceSettings.refAudioPath ?? ''
          if (!refAudioPath.trim())
            throw new Error('Set the GPT-SoVITS reference audio path in provider settings first.')

          const audio = await synthesizeWithGptSovits(
            config.baseUrl ?? defaultBaseUrl,
            body.input ?? '',
            {
              refAudioPath,
              promptText: voiceSettings.promptText ?? '',
              promptLanguage: voiceSettings.promptLanguage ?? 'zh',
              textLanguage: voiceSettings.textLanguage ?? 'zh',
              speedFactor: voiceSettings.speedFactor ?? 1,
              temperature: voiceSettings.temperature ?? 0.9,
            },
            { signal: init.signal ?? undefined },
          )
          return new Response(audio, { headers: { 'Content-Type': 'audio/wav' }, status: 200 })
        },
      }),
    }
  },
  validationRequiredWhen: config => Boolean(config.baseUrl?.trim()),
  validators: {
    validateConfig: [
      ({ t }) => ({
        id: 'gpt-sovits:check-config',
        name: t('settings.pages.providers.catalog.edit.validators.openai-compatible.check-config.title'),
        validator: async (config) => {
          const baseUrl = config.baseUrl?.trim() ?? ''
          let reason = ''
          try {
            const url = new URL(baseUrl)
            if (!url.host || !['http:', 'https:'].includes(url.protocol))
              reason = 'Base URL must be an absolute http:// or https:// address.'
          }
          catch {
            reason = 'Base URL must be an absolute http:// or https:// address.'
          }
          if (!reason && !config.voiceSettings?.refAudioPath?.trim())
            reason = 'Reference audio path is required.'
          return reason
            ? { errors: [{ error: new Error(reason) }], reason, reasonKey: '', valid: false }
            : { errors: [], reason: '', reasonKey: '', valid: true }
        },
      }),
    ],
  },
  extraMethods: {
    listModels: async () => [{
      contextLength: 0,
      deprecated: false,
      description: '',
      id: syntheticModelId,
      name: 'GPT-SoVITS',
      provider: providerId,
    }],
    listVoices: async () => [{
      id: syntheticVoiceId,
      languages: [{ code: 'zh', title: 'Chinese' }],
      name: 'Reference audio',
      provider: providerId,
    } satisfies VoiceInfo],
    voiceCatalogConfig: ({ baseUrl }) => ({ baseUrl }),
  },
})
