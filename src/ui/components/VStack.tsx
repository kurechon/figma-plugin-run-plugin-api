import { css } from '@emotion/react'
import { Property } from 'csstype'
import { PropsWithChildren } from 'react'

type VStackProps = JSX.IntrinsicElements['div'] & {
  align?: Property.AlignItems
  justify?: Property.JustifyContent
}

const VStack = ({
  align = 'stretch',
  justify = 'inherit',
  children,
  ...delegated
}: PropsWithChildren<VStackProps>) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        align-items: ${align};
        justify-content: ${justify};
      `}
      {...delegated}
    >
      {children}
    </div>
  )
}

export default VStack
