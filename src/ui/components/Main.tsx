import { css } from '@emotion/react'
import ReactMonacoEditor, { Monaco } from '@monaco-editor/react'
import type * as MonacoEditor from 'monaco-editor'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { PostMessage } from '@/@types/common'
import { ONCHANGE_TIMER_DURATION } from '@/constants'
import { useStore } from '@/ui/Store'
import IconFile from '@/ui/assets/img/icon_file.inline.svg'
import IconPlay from '@/ui/assets/img/icon_play.inline.svg'
import IconSetting from '@/ui/assets/img/icon_setting.inline.svg'
import IconTrash from '@/ui/assets/img/icon_trash.inline.svg'
import Button from '@/ui/components/Button'
import Divider from '@/ui/components/Divider'
import HStack from '@/ui/components/HStack'
import Loading from '@/ui/components/Loading'
import Spacer from '@/ui/components/Spacer'
import VStack from '@/ui/components/VStack'
import figmaTypings from '@/ui/assets/types/figma.d.ts?raw'
import IconChevronDown from '@/ui/assets/img/icon_chevron_down.inline.svg'
import { color, spacing, typography } from '@/ui/styles'

const Main = () => {
  const code = useStore(s => s.code)
  const setCode = useStore(s => s.setCode)
  const editorOptions = useStore(s => s.editorOptions)
  const cursorPosition = useStore(s => s.cursorPosition)
  const setCursorPosition = useStore(s => s.setCursorPosition)
  const theme = useStore(s => s.theme)
  const isGotOptions = useStore(s => s.isGotOptions)
  const isMainEditorMounted = useStore(s => s.isMainEditorMounted)
  const setIsMainEditorMounted = useStore(s => s.setIsMainEditorMounted)
  const setCurrentScreen = useStore(s => s.setCurrentScreen)
  const updateTheme = useStore(s => s.updateTheme)
  const history = useStore(s => s.history)
  const selectedHistoryId = useStore(s => s.selectedHistoryId)
  const loadFromHistory = useStore(s => s.loadFromHistory)
  const clearEditor = useStore(s => s.clearEditor)
  const isDirty = useStore(s => s.isDirty)
  const setIsDirty = useStore(s => s.setIsDirty)
  const setPendingExecCode = useStore(s => s.setPendingExecCode)
  const deleteHistory = useStore(s => s.deleteHistory)
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor>()
  const monacoRef = useRef<Monaco>()
  const modelRef = useRef<MonacoEditor.editor.ITextModel>()
  const onChangeTimer = useRef(0)
  const onCursorPositionChangeTimer = useRef(0)
  const [error, setError] = useState<MonacoEditor.editor.IMarker[]>([])
  const errorRef = useRef<MonacoEditor.editor.IMarker[]>([])

  // add keyboard shortcut for outside of editor
  useHotkeys('ctrl+enter, command+enter', (event, handler) => {
    console.log(
      'CodeEditor cmd + enter pressed at outer of editor',
      event,
      handler
    )
    exec()
  })

  function getCompilerOptions(monaco: Monaco) {
    const compilerOptions: MonacoEditor.typescript.CompilerOptions = {
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      allowNonTsExtensions: true,
      noEmit: true
    }

    return compilerOptions
  }

  function beforeMount(monaco: Monaco) {
    console.log('CodeEditor beforeMount', monaco)

    // refに引数を入れて他の場所で参照できるようにする
    monacoRef.current = monaco

    // validation settings
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      // エラーコード1375（top level await）を無視するように設定
      diagnosticCodesToIgnore: [1375]
    })

    // compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      getCompilerOptions(monaco)
    )

    // add external libraries (figma typings)
    const libSource = figmaTypings
    const libUri = 'ts:filename/figma.d.ts'
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      libSource,
      libUri
    )

    // When resolving definitions and references, the editor will try to use created models.
    // Creating a model for the library allows "peek definition/references" commands to work with the library.
    modelRef.current = monaco.editor.createModel(
      libSource,
      'typescript',
      monaco.Uri.parse(libUri)
    )
  }

  async function onMount(
    editor: MonacoEditor.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) {
    console.log('CodeEditor onMount', editor, monaco)

    // refに引数を入れて他の場所で参照できるようにする
    editorRef.current = editor

    // apply theme
    await updateTheme(monaco, theme)

    // add keyboard shortcut for inside of editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handler => {
      console.log('CodeEditor cmd + enter pressed at inner of editor', handler)
      exec()
    })

    // focus editor
    editor.focus()

    // apply cursor position
    editor.setPosition(cursorPosition)

    // watch cursor position and save position
    editor.onDidChangeCursorPosition(onCursorPositionChange)

    setIsMainEditorMounted(true)
  }

  function onChange(
    value: string | undefined,
    event: MonacoEditor.editor.IModelContentChangedEvent
  ) {
    console.log('CodeEditor onChange', value, event)

    const newCode = value || ''
    const newCursorPosition = editorRef.current?.getPosition() || {
      lineNumber: 0,
      column: 0
    }

    setCode(newCode)
    setCursorPosition(newCursorPosition)
    setIsDirty(true)

    // ちょっと遅延させてclientStorageに値を保存する
    window.clearInterval(onChangeTimer.current)
    onChangeTimer.current = window.setTimeout(() => {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'set-options',
            options: {
              editorOptions,
              code: newCode,
              cursorPosition: newCursorPosition,
              theme
            }
          }
        } as PostMessage,
        '*'
      )
      console.log('postMessage: set-options')
    }, ONCHANGE_TIMER_DURATION)
  }

  function onCursorPositionChange(
    event: MonacoEditor.editor.ICursorPositionChangedEvent
  ) {
    // ユーザーが任意でカーソル移動させた時以外はreturn
    if (event.reason !== 3) {
      return
    }

    setCursorPosition(event.position)

    // ちょっと遅延させてclientStorageに値を保存する
    window.clearInterval(onCursorPositionChangeTimer.current)
    onCursorPositionChangeTimer.current = window.setTimeout(() => {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'set-options',
            options: {
              editorOptions,
              code,
              cursorPosition: event.position,
              theme
            }
          }
        } as PostMessage,
        '*'
      )
      console.log('postMessage: set-options')
    }, ONCHANGE_TIMER_DURATION)
  }

  function onValidate(markers: MonacoEditor.editor.IMarker[]) {
    console.log('CodeEditor onValidate', markers)

    // severityが8のものだけをerrorに入れる
    const errors = markers.filter(marker => marker.severity === 8)

    setError(errors)
  }

  function exec() {
    if (!editorRef.current || code.length === 0) {
      console.log('exec aborted')
      return
    }

    console.log('exec')

    // エディタの現在の値をasync関数に入れる
    const tsCode = `
      (async () => {
        ${editorRef.current.getValue()}
      })();
    `
    console.log('tsCode', tsCode)
    const jsCode = ts.transpile(
      tsCode,
      getCompilerOptions(monacoRef.current as Monaco)
    )
    console.log('jsCode', jsCode)

    setPendingExecCode(editorRef.current.getValue())

    parent.postMessage(
      {
        pluginMessage: {
          type: 'exec',
          code: jsCode
        }
      } as PostMessage,
      '*'
    )
    console.log('postMessage: exec')
  }

  function onHistoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    if (value === '') {
      clearEditor()
    } else {
      loadFromHistory(value)
    }
  }

  function onSettingClick() {
    setCurrentScreen('setting')
  }

  useEffect(() => {
    console.log('Main mounted')
    // setIsMainEditorMounted(false)

    // destroy textModel on unmount
    return () => {
      console.log('Main unmounted')
      if (modelRef.current) {
        modelRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    errorRef.current = error
  }, [error])

  return (
    <VStack
      css={css`
        position: relative;
        height: 100%;
      `}
    >
      <HStack
        css={css`
          padding: ${spacing[2]} ${spacing[2]} ${spacing[2]} 18px;
          position: relative;
          cursor: pointer;
        `}
      >
        <select
          value={selectedHistoryId ?? ''}
          onChange={onHistoryChange}
          css={css`
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          `}
        >
          <option value="">New</option>
          {history.map(entry => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>

        <IconFile
          css={css`
            pointer-events: none;
            fill: ${color.text};
            flex-shrink: 0;
          `}
        />

        <Spacer x={spacing[2]} />

        <span
          css={css`
            font-size: ${typography.fontSize};
            color: ${selectedHistoryId ? color.text : color.inactive};
            font-style: ${isDirty ? 'italic' : 'normal'};
            pointer-events: none;
          `}
        >
          {selectedHistoryId
            ? (history.find(h => h.id === selectedHistoryId)?.title ?? 'New')
            : 'New'}
        </span>

        <Spacer x={spacing[1]} />

        <IconChevronDown
          css={css`
            pointer-events: none;
            fill: ${color.disabled};
            flex-shrink: 0;
          `}
        />
      </HStack>

      {/* editor */}
      {isGotOptions && (
        <div
          css={css`
            flex: 1;
          `}
        >
          <ReactMonacoEditor
            beforeMount={beforeMount}
            defaultLanguage="typescript"
            onChange={onChange}
            onMount={onMount}
            onValidate={onValidate}
            options={{
              ...editorOptions,
              padding: { ...editorOptions.padding, top: 0 },
              renderLineHighlight: 'none' as const
            }}
            theme={theme}
            value={code}
          />
        </div>
      )}

      <Divider />

      {/* bottom area */}
      <HStack
        css={css`
          padding: ${spacing[2]};
        `}
      >
        {/* setting button */}
        <Button type="ghost" padding={false} onClick={onSettingClick}>
          <IconSetting />
        </Button>

        <Spacer x={spacing[2]} />

        {/* documentation link */}
        <a
          href="https://www.figma.com/plugin-docs/api/api-reference/"
          target="_blank"
          rel="noreferrer"
        >
          View API documentation
        </a>

        <Spacer stretch={true} />

        {selectedHistoryId && (
          <>
            <Button
              type="ghost"
              padding={false}
              onClick={() => {
                if (confirm('Delete this history entry?')) {
                  deleteHistory(selectedHistoryId)
                }
              }}
            >
              <IconTrash
                css={css`
                  fill: ${color.alert};
                `}
              />
            </Button>

            <Spacer x={spacing[2]} />
          </>
        )}

        {/* exec button */}
        <Button type="primary" onClick={exec} disabled={code.length === 0}>
          <IconPlay />
          <Spacer x={spacing[2]} />
          <div>Run code (Cmd + Enter)</div>
        </Button>
      </HStack>

      {/* loading */}
      {!isMainEditorMounted && <Loading>Loading</Loading>}
    </VStack>
  )
}

export default Main
