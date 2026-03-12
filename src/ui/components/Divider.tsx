import { css } from '@emotion/react'
import { color } from '@/ui/styles'

type DividerProps = JSX.IntrinsicElements['div'] & {
  direction?: 'column' | 'row'
}

const Divider = ({ direction = 'row', ...delegated }: DividerProps) => {
  const width = direction === 'column' ? '1px' : '100%'
  const height = direction === 'row' ? '1px' : '100%'

  return (
    <div
      css={css`
        background-color: ${color.border};
        width: ${width};
        height: ${height};
      `}
      {...delegated}
    />
  )
}

export default Divider
