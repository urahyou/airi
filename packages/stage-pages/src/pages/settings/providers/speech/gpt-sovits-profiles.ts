export interface VoiceProfile {
  name: string
  settings: Record<string, unknown>
}

const voiceFields = ['refAudioPath', 'promptText', 'promptLanguage', 'textLanguage', 'speedFactor', 'temperature'] as const

export function saveProfile(profiles: VoiceProfile[], name: string, settings: Record<string, unknown>): VoiceProfile[] {
  const cleaned = name.trim()
  if (!cleaned)
    return profiles
  const snapshot = Object.fromEntries(voiceFields.map(key => [key, settings[key]]))
  return [...profiles.filter(profile => profile.name !== cleaned), { name: cleaned, settings: snapshot }]
}

export function selectProfile(profiles: VoiceProfile[], name: string): Record<string, unknown> | undefined {
  const profile = profiles.find(item => item.name === name)
  return profile ? { ...profile.settings } : undefined
}
