<script setup lang="ts">
import type { SpeechProvider } from '@xsai-ext/providers/utils'

import type { VoiceProfile } from './gpt-sovits-profiles'

import { SpeechPlayground, SpeechProviderSettings } from '@proj-airi/stage-ui/components'
import { useSpeechStore } from '@proj-airi/stage-ui/stores/modules/speech'
import { useProviderConfigStore } from '@proj-airi/stage-ui/stores/providers/config'
import { useProviderStore } from '@proj-airi/stage-ui/stores/providers/provider'
import { FieldInput, FieldRange, FieldTextArea } from '@proj-airi/ui'
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { saveProfile, selectProfile } from './gpt-sovits-profiles'

const providerId = 'gpt-sovits'
const defaultModel = 'default'
const { t } = useI18n()
const speechStore = useSpeechStore()
const providersStore = useProviderStore()
const providerStore = useProviderConfigStore()
const profiles = useLocalStorage<VoiceProfile[]>('settings/gpt-sovits/voice-profiles', [])
const selectedProfile = useLocalStorage('settings/gpt-sovits/selected-voice-profile', '')
const profileName = ref('')

function saveCurrent(settings: Record<string, unknown>) {
  const name = profileName.value.trim()
  if (!name)
    return
  profiles.value = saveProfile(profiles.value, name, settings)
  selectedProfile.value = name
  profileName.value = ''
}

function changeProfile(name: string, settings: Record<string, unknown>) {
  if (selectedProfile.value)
    profiles.value = saveProfile(profiles.value, selectedProfile.value, settings)
  const next = selectProfile(profiles.value, name)
  if (next) {
    Object.assign(settings, next)
    selectedProfile.value = name
  }
}

const availableVoices = computed(() => speechStore.availableVoices[providerId] || [])

onMounted(async () => {
  await speechStore.loadVoicesForProvider(providerId)
})

async function handleGenerateSpeech(input: string, voiceId: string) {
  const provider = await providersStore.getProviderInstance(providerId) as SpeechProvider
  if (!provider)
    throw new Error('Failed to initialize speech provider')

  return await speechStore.speech(
    provider,
    defaultModel,
    input,
    voiceId,
    { ...providerStore.getProviderConfig(providerId) },
  )
}
</script>

<template>
  <SpeechProviderSettings :provider-id="providerId" :default-model="defaultModel" hide-api-key>
    <template #voice-settings="{ voiceSettings }">
      <div class="flex flex-col gap-4">
        <label class="flex flex-col gap-2">
          <span>音色列表</span>
          <select
            class="w-full border border-neutral-300 rounded-lg bg-transparent p-2"
            :value="selectedProfile"
            @change="changeProfile(($event.target as HTMLSelectElement).value, voiceSettings)"
          >
            <option value="" disabled>请选择已保存的音色</option>
            <option v-for="profile in profiles" :key="profile.name" :value="profile.name">{{ profile.name }}</option>
          </select>
        </label>
        <div class="flex gap-2">
          <input v-model="profileName" class="min-w-0 flex-1 border border-neutral-300 rounded-lg bg-transparent p-2" placeholder="音色名称，例如伊瑟琳">
          <button class="border border-neutral-300 rounded-lg px-4 py-2" :disabled="!profileName.trim()" @click="saveCurrent(voiceSettings)">
            保存当前音色
          </button>
        </div>
        <FieldInput
          v-model="voiceSettings.refAudioPath"
          :label="t('settings.pages.providers.provider.gpt-sovits.fields.field.ref-audio-path.label')"
          :description="t('settings.pages.providers.provider.gpt-sovits.fields.field.ref-audio-path.description')"
          placeholder="/path/to/reference.wav"
        />
        <FieldTextArea
          v-model="voiceSettings.promptText"
          :label="t('settings.pages.providers.provider.gpt-sovits.fields.field.prompt-text.label')"
          :description="t('settings.pages.providers.provider.gpt-sovits.fields.field.prompt-text.description')"
          :rows="3"
        />
        <FieldInput
          v-model="voiceSettings.promptLanguage"
          :label="t('settings.pages.providers.provider.gpt-sovits.fields.field.prompt-language.label')"
          :description="t('settings.pages.providers.provider.gpt-sovits.fields.field.prompt-language.description')"
          placeholder="zh"
        />
        <FieldInput
          v-model="voiceSettings.textLanguage"
          :label="t('settings.pages.providers.provider.gpt-sovits.fields.field.text-language.label')"
          :description="t('settings.pages.providers.provider.gpt-sovits.fields.field.text-language.description')"
          placeholder="zh"
        />
        <FieldRange
          v-model="voiceSettings.speedFactor"
          :label="t('settings.pages.providers.provider.gpt-sovits.fields.field.speed-factor.label')"
          :description="t('settings.pages.providers.provider.gpt-sovits.fields.field.speed-factor.description')"
          :min="0.5" :max="2" :step="0.05"
        />
        <FieldRange
          v-model="voiceSettings.temperature"
          :label="t('settings.pages.providers.provider.gpt-sovits.fields.field.temperature.label')"
          :description="t('settings.pages.providers.provider.gpt-sovits.fields.field.temperature.description')"
          :min="0.1" :max="1.5" :step="0.05"
        />
      </div>
    </template>
    <template #playground>
      <SpeechPlayground
        :available-voices="availableVoices"
        :generate-speech="handleGenerateSpeech"
        :api-key-configured="true"
        :use-ssml="false"
        :default-text="t('settings.pages.providers.provider.gpt-sovits.playground.default-text')"
      />
    </template>
  </SpeechProviderSettings>
</template>

<route lang="yaml">
  meta:
    layout: settings
    stageTransition:
      name: slide
</route>
