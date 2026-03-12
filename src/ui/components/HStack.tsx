import { css } from '@emotion/react'
import { Property } from 'csstype'
import { PropsWithChildren } from 'react'

type HStackProps = JSX.IntrinsicElements['div'] & {
  align?: Property.AlignItems
  justify?: Property.JustifyContent
}

const HStack = ({
  align = 'center',
  justify = 'inherit',
  children,
  ...delegated
}: PropsWithChildren<HStackProps>) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: row;
        align-items: ${align};
        justify-content: ${justify};
      `}
      {...delegated}
    >
      {children}
    </div>
  )
}

export default HStack
