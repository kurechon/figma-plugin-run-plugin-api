import { css, Global } from '@emotion/react'
import { loader } from '@monaco-editor/react'
import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import 'ress'
import { CDN_URL } from '@/constants'
import { useStore } from '@/ui/Store'
import Main from '@/ui/components/Main'
import Setting from '@/ui/components/Setting'
import { typography, color } from '@/ui/styles'

// change cdn url to custom builded monaco-editor
loader.config({
  paths: {
    vs: CDN_URL + '/min/vs'
  }
})

const App = () => {
  const getOptions = useStore(s => s.getOptions)
  const listenPluginMessage = useStore(s => s.listenPluginMessage)
  const closePlugin = useStore(s => s.closePlugin)
  const currentScreen = useStore(s => s.currentScreen)

  // listen keyboard shortcut
  useHotkeys(
    'esc',
    (event, handler) => {
      console.log('esc pressed', event, handler)
      closePlugin()
    },
    {
      enableOnFormTags: ['INPUT', 'SELECT', 'TEXTAREA']
    }
  )

  useEffect(() => {
    console.log('App mounted')

    // get options
    getOptions()

    // start listen pluginMessage
    listenPluginMessage()
  }, [])

  return (
    <>
      <Global
        styles={css`
          body {
            font-family: ${typography.fontFamily};
            font-size: ${typography.fontSize};
            line-height: ${typography.lineHeight};
            font-weight: ${typography.fontWeightDefault};
            background-color: ${color.bg};
            cursor: default;
            user-select: none;
          }

          :any-link {
            color: ${color.primary};
            text-decoration: none;
            cursor: default;
          }

          #plugin {
            width: 100vw;
            height: 100vh;
          }
        `}
      />
      {currentScreen === 'main' && <Main />}
      {currentScreen === 'setting' && <Setting />}
    </>
  )
}

export default App
