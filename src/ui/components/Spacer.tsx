import { css } from '@emotion/react'

type SpacerProps = JSX.IntrinsicElements['div'] & {
  x?: string
  y?: string
  stretch?: boolean
}

const Spacer = ({ x, y, stretch, ...delegated }: SpacerProps) => {
  const width = x || '100%'
  const height = y || '100%'
  const flex = stretch ? 1 : 'initial'

  return (
    <div
      css={css`
        /* background-color: rgba(255, 0, 0, 0.2); */
        width: ${width};
        height: ${height};
        flex: ${flex};
      `}
      {...delegated}
    />
  )
}

export default Spacer
