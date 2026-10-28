import { describe, expect, it } from 'vitest'

import { saveProfile, selectProfile } from './gpt-sovits-profiles'

describe('gPT-SoVITS voice profiles', () => {
  it('keeps the current settings when switching between named voices', () => {
    const oldVoice = { refAudioPath: '/old.wav', promptText: '旧台词', promptLanguage: 'zh', textLanguage: 'zh', speedFactor: 1, temperature: 0.9 }
    const newVoice = { ...oldVoice, refAudioPath: '/new.wav', promptText: '新台词' }
    const profiles = saveProfile([], '原来的音色', oldVoice)
    const both = saveProfile(profiles, '伊瑟琳', newVoice)
    expect(selectProfile(both, '原来的音色')).toEqual(oldVoice)
    expect(selectProfile(both, '伊瑟琳')).toEqual(newVoice)
    expect(selectProfile(both, '不存在')).toBeUndefined()
  })
})
