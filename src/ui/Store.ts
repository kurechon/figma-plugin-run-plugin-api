import { Monaco } from '@monaco-editor/react'
import { create } from 'zustand'
import {
  AllThemeType,
  BuiltinThemeType,
  CodeHistory,
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
  history: CodeHistory[]
  setHistory: (history: CodeHistory[]) => void
  selectedHistoryId: string | null
  setSelectedHistoryId: (id: string | null) => void
  isDirty: boolean
  setIsDirty: (isDirty: boolean) => void
  pendingExecCode: string | null
  setPendingExecCode: (code: string | null) => void
  getOptions: () => void
  updateOptions: (pluginMessage: GetOptionsSuccessMessage) => void
  listenPluginMessage: () => void
  closePlugin: () => void
  updateTheme: (monaco: Monaco, theme: Options['theme']) => Promise<void>
  addToHistory: (code: string) => void
  loadFromHistory: (id: string) => void
  clearEditor: () => void
  deleteHistory: (id: string) => void
}

export const useStore = create<StoreState>()((set, get) => ({
  code: defaultOptions.code,
  setCode: code => set({ code }),
  editorOptions: defaultOptions.editorOptions,
  setEditorOptions: editorOptions => set({ editorOptions }),
  cursorPosition: defaultOptions.cursorPosition,
  setCursorPosition: cursorPosition => set({ cursorPosition }),
  theme: defaultOptions.theme,
  setTheme: theme => set({ theme }),
  isGotOptions: false,
  setIsGotOptions: isGotOptions => set({ isGotOptions }),
  isMainEditorMounted: false,
  setIsMainEditorMounted: isMainEditorMounted => set({ isMainEditorMounted }),
  currentScreen: 'main' as CurrentScreen,
  setCurrentScreen: currentScreen => set({ currentScreen }),
  history: [] as CodeHistory[],
  setHistory: history => set({ history }),
  selectedHistoryId: null as string | null,
  setSelectedHistoryId: id => set({ selectedHistoryId: id }),
  isDirty: false,
  setIsDirty: isDirty => set({ isDirty }),
  pendingExecCode: null as string | null,
  setPendingExecCode: code => set({ pendingExecCode: code }),

  getOptions: () => {
    parent.postMessage(
      {
        pluginMessage: { type: 'get-options' }
      } as PostMessage,
      '*'
    )
    console.log('postMessage: get-options')
  },

  updateOptions: pluginMessage => {
    const options = pluginMessage.options
    const historyItems = pluginMessage.history || []
    const matchingEntry = historyItems.find(h => h.code === options.code)

    set({
      code: options.code,
      editorOptions: options.editorOptions,
      cursorPosition: options.cursorPosition,
      theme: options.theme,
      history: historyItems,
      selectedHistoryId: matchingEntry?.id ?? null,
      isGotOptions: true
    })
  },

  listenPluginMessage: () => {
    console.log('listening pluginMessage...')

    onmessage = event => {
      if (!event.data.pluginMessage) {
        return
      }

      const pluginMessage: PluginMessage = event.data.pluginMessage

      switch (pluginMessage.type) {
        case 'get-options-success':
          console.log('onmessage: get-options-success', pluginMessage)
          get().updateOptions(pluginMessage)
          break

        case 'exec-success': {
          console.log('onmessage: exec-success')
          const pending = get().pendingExecCode
          if (pending !== null) {
            get().addToHistory(pending)
            set({ pendingExecCode: null, isDirty: false })
          }
          break
        }

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
  },

  addToHistory: code => {
    const currentHistory = get().history
    const existing = currentHistory.find(h => h.code === code)

    if (existing) {
      set({ selectedHistoryId: existing.id })
      return
    }

    const title =
      code
        .split('\n')[0]
        .replace(/^\/\/\s*/, '')
        .trim() || 'Untitled'
    const newEntry: CodeHistory = {
      id: Date.now().toString(),
      title,
      code,
      timestamp: Date.now()
    }

    const newHistory = [newEntry, ...currentHistory].slice(0, 20)

    set({ history: newHistory, selectedHistoryId: newEntry.id })

    parent.postMessage(
      {
        pluginMessage: {
          type: 'set-history',
          history: newHistory
        }
      } as PostMessage,
      '*'
    )
    console.log('postMessage: set-history', newHistory)
  },

  loadFromHistory: id => {
    const entry = get().history.find(h => h.id === id)
    if (!entry) return

    set({
      code: entry.code,
      selectedHistoryId: id,
      cursorPosition: { lineNumber: 1, column: 1 },
      isDirty: false
    })
    console.log('loadFromHistory', entry.title)
  },

  clearEditor: () => {
    set({
      code: defaultOptions.code,
      selectedHistoryId: null,
      cursorPosition: { lineNumber: 1, column: 1 },
      isDirty: false
    })
    console.log('clearEditor')
  },

  deleteHistory: id => {
    const newHistory = get().history.filter(h => h.id !== id)

    set({ history: newHistory })

    parent.postMessage(
      {
        pluginMessage: {
          type: 'set-history',
          history: newHistory
        }
      } as PostMessage,
      '*'
    )
    console.log('postMessage: set-history (delete)', newHistory)

    get().clearEditor()
  }
}))
