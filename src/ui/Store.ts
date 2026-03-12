import { Monaco } from '@monaco-editor/react'
import { create } from 'zustand'
import {
  AllThemeType,
  BuiltinThemeType,
  CurrentScreen,
  GetOptionsSuccessMessage,
  Options,
  PluginMessage,
  PostMessage
} from '@/@types/common'
import { CDN_URL } from '@/constants'
import defaultOptions from '@/defaultOptions'
import { allTheme } from '@/ui/themeList'

type StoreState = {
  code: string
  setCode: (code: string) => void
  editorOptions: Options['editorOptions']
  setEditorOptions: (editorOptions: Options['editorOptions']) => void
  cursorPosition: Options['cursorPosition']
  setCursorPosition: (cursorPosition: Options['cursorPosition']) => void
  theme: Options['theme']
  setTheme: (theme: Options['theme']) => void
  isGotOptions: boolean
  setIsGotOptions: (isGotOptions: boolean) => void
  isMainEditorMounted: boolean
  setIsMainEditorMounted: (isMainEditorMounted: boolean) => void
  currentScreen: CurrentScreen
  setCurrentScreen: (currentScreen: CurrentScreen) => void
  getOptions: () => void
  updateOptions: (pluginMessage: GetOptionsSuccessMessage) => void
  listenPluginMessage: () => void
  closePlugin: () => void
  updateTheme: (monaco: Monaco, theme: Options['theme']) => Promise<void>
}

export const useStore = create<StoreState>()((set, get) => ({
  code: defaultOptions.code,
  setCode: (code) => set({ code }),
  editorOptions: defaultOptions.editorOptions,
  setEditorOptions: (editorOptions) => set({ editorOptions }),
  cursorPosition: defaultOptions.cursorPosition,
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),
  theme: defaultOptions.theme,
  setTheme: (theme) => set({ theme }),
  isGotOptions: false,
  setIsGotOptions: (isGotOptions) => set({ isGotOptions }),
  isMainEditorMounted: false,
  setIsMainEditorMounted: (isMainEditorMounted) => set({ isMainEditorMounted }),
  currentScreen: 'main' as CurrentScreen,
  setCurrentScreen: (currentScreen) => set({ currentScreen }),

  getOptions: () => {
    parent.postMessage(
      {
        pluginMessage: { type: 'get-options' }
      } as PostMessage,
      '*'
    )
    console.log('postMessage: get-options')
  },

  updateOptions: (pluginMessage) => {
    const options = pluginMessage.options
    set({
      code: options.code,
      editorOptions: options.editorOptions,
      cursorPosition: options.cursorPosition,
      theme: options.theme,
      isGotOptions: true
    })
  },

  listenPluginMessage: () => {
    console.log('listening pluginMessage...')

    onmessage = (event) => {
      if (!event.data.pluginMessage) {
        return
      }

      const pluginMessage: PluginMessage = event.data.pluginMessage

      switch (pluginMessage.type) {
        case 'get-options-success':
          console.log('onmessage: get-options-success', pluginMessage)
          get().updateOptions(pluginMessage)
          break

        default:
          break
      }
    }
  },

  closePlugin: () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'close-plugin'
        }
      } as PostMessage,
      '*'
    )
    console.log('postMessage: close-plugin')
  },

  updateTheme: async (monaco, theme) => {
    console.log('updateTheme', theme)

    function isBuiltinTheme(
      theme: keyof AllThemeType
    ): theme is keyof BuiltinThemeType {
      return theme === 'light' || theme === 'vs-dark'
    }

    if (isBuiltinTheme(theme)) {
      console.log('apply builtinTheme', theme)
      monaco.editor.setTheme(theme)
    } else {
      const url = `${CDN_URL}/themes/${allTheme[theme]}.json`

      try {
        console.log('fetchTheme', allTheme[theme])
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to fetch theme: ${res.status}`)
        const json = await res.json()
        console.log(theme, allTheme[theme], json)

        monaco.editor.defineTheme(theme, json)
        monaco.editor.setTheme(theme)
      } catch (error) {
        console.error('Failed to fetch theme, falling back to light', error)
        monaco.editor.setTheme('light')
        set({ theme: 'light' })
        console.log('updateTheme finish (fallback)')
        return
      }
    }

    set({ theme })
    console.log('updateTheme finish')
  }
}))
