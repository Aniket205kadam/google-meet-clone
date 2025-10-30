import { useEffect } from "react"

const useClickOutside = (elementRef, handler) => {
    useEffect(() => {
        const checkClickLocation = (event) => {
            if (!elementRef.current?.contains(event.target)) {
                handler();
            }
        };
        document.addEventListener("mousedown", checkClickLocation);
        return () => document.removeEventListener("mousedown", checkClickLocation);
    }, [elementRef, handler])
}

export default useClickOutside;