import { useRef } from "react";

const useDebounce = (fn, delay) => {
    const timerRef = useRef(null);

    return (...args) => {
        clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            fn(...args);
        }, delay);
    }
}

export default useDebounce;