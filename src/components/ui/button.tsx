import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border text-[12px] font-medium tracking-[.14em] uppercase whitespace-nowrap transition-all outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-fg bg-transparent text-fg hover:bg-fg hover:text-bg active:opacity-80",
        solid:
          "border-fg bg-fg text-bg hover:bg-transparent hover:text-fg active:opacity-80",
        outline:
          "border-rule bg-transparent text-fg hover:border-fg active:opacity-80",
        ghost:
          "border-transparent bg-transparent text-fg hover:border-rule active:opacity-80",
        destructive:
          "border-rule bg-transparent text-fg hover:border-fg active:opacity-80",
        link: "border-transparent bg-transparent text-fg underline-offset-4 hover:underline",
        secondary:
          "border-rule bg-transparent text-fg-soft hover:border-fg hover:text-fg active:opacity-80",
      },
      size: {
        default: "h-9 gap-2 px-[22px] py-[13px]",
        xs: "h-6 gap-1 px-2 text-[11px]",
        sm: "h-7 gap-1 px-[14px] py-[9px] text-[11px]",
        lg: "h-10 gap-2 px-6",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
