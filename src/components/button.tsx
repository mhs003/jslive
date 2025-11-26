import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
    {
        variants: {
            variant: {
                primary:
                    "bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200/90",
                secondary:
                    "bg-zinc-800 text-zinc-100 shadow-sm hover:bg-zinc-800/80",
                ghost: "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100",
                outline:
                    "border border-zinc-800 bg-transparent shadow-sm hover:bg-zinc-800 text-zinc-100",
                success:
                    "bg-emerald-600 text-white shadow hover:bg-emerald-500",
                destructive: "text-red-500 hover:bg-zinc-800",
            },
        },
        defaultVariants: {
            variant: "primary",
        },
    }
);

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    children: ReactNode;
    className?: string;
}

export function Button({
    children,
    variant,
    className,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(buttonVariants({ variant }), className)}
            {...props}
        >
            {children}
        </button>
    );
}

export { buttonVariants };
