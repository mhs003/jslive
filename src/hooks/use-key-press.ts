import { useEffect, useRef } from "react";

type Binding = {
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
};

function parseBinding(binding: string): Binding {
    const parts = binding.split("+");
    const key = parts.pop() || "";
    return {
        key,
        ctrl: parts.includes("Ctrl"),
        shift: parts.includes("Shift"),
        alt: parts.includes("Alt"),
        meta: parts.includes("Meta"),
    };
}

type CallbackInfo = {
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
};

type Target = string | null | string[];

export function useKeyPress(
    bindings: string | string[],
    callback: (e: KeyboardEvent, info: CallbackInfo) => void,
    target: Target = null
) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const parsedBindings = Array.isArray(bindings)
            ? bindings.map(parseBinding)
            : [parseBinding(bindings)];

        let targetElements: EventTarget[] = [];

        if (!target) {
            targetElements = [window];
        } else if (typeof target === "string") {
            const el = document.querySelector(target);
            if (el) targetElements = [el];
        } else if (Array.isArray(target)) {
            targetElements = target
                .map((sel) => document.querySelector(sel))
                .filter((el): el is Element => Boolean(el));
        }

        const handleKeyPress = (event: KeyboardEvent) => {
            parsedBindings.forEach(({ key, ctrl, shift, alt, meta }) => {
                if (
                    key === "*" ||
                    (event.key === key &&
                        event.ctrlKey === ctrl &&
                        event.shiftKey === shift &&
                        event.altKey === alt &&
                        event.metaKey === meta)
                ) {
                    if (
                        targetElements.length &&
                        target &&
                        !targetElements.includes(event.target as EventTarget)
                    )
                        return;

                    callbackRef.current(event, {
                        key: event.key,
                        ctrl: event.ctrlKey,
                        shift: event.shiftKey,
                        alt: event.altKey,
                        meta: event.metaKey,
                    });
                }
            });
        };

        targetElements.forEach((el) => {
            (el as any).addEventListener("keydown", handleKeyPress);
        });

        return () => {
            targetElements.forEach((el) => {
                (el as any).removeEventListener("keydown", handleKeyPress);
            });
        };
    }, [bindings, target]);
}
