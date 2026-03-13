import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { builtinTheme, customTheme } from '@/ui/themeList'

type BuiltinThemeType = typeof builtinTheme
type CustomThemeType = typeof customTheme
type AllThemeType = BuiltinThemeType & CustomThemeType

type Options = {
  editorOptions: monaco.editor.IStandaloneEditorConstructionOptions
  code: string
  cursorPosition: monaco.IPosition | monaco.Position
  theme: keyof AllThemeType
}

type CodeHistory = {
  id: string
  title: string
  code: string
  timestamp: number
}

type HistoryData = {
  items: CodeHistory[]
}

type CurrentScreen = 'main' | 'setting'

type ClosePluginMessage = {
  type: 'close-plugin'
}
type GetOptionsMessage = {
  type: 'get-options'
}
type GetOptionsSuccessMessage = {
  type: 'get-options-success'
  options: Options
  history: CodeHistory[]
}
type SetOptionsMessage = {
  type: 'set-options'
  options: Options
}
type ExecMessage = {
  type: 'exec'
  code: string
}
type ExecSuccessMessage = {
  type: 'exec-success'
}
type NotifyMessage = {
  type: 'notify'
  message: string
  options?: NotificationOptions
}
type SetHistoryMessage = {
  type: 'set-history'
  history: CodeHistory[]
}

type PluginMessage =
  | ClosePluginMessage
  | GetOptionsMessage
  | GetOptionsSuccessMessage
  | SetOptionsMessage
  | ExecMessage
  | ExecSuccessMessage
  | NotifyMessage
  | SetHistoryMessage

type PostMessage = {
  pluginMessage: PluginMessage
}
