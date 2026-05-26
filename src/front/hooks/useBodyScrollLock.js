// useBodyScrollLock — bloquea el scroll del body (y de los scroll containers
// internos como .private-content) mientras un modal/overlay está abierto.
//
// Se usa en todos los modales fullscreen de la app (AvatarPickerModal,
// GamingPreferencesModal, LanguageModal, AddGameModal, AddCommentModal) para
// evitar que el contenido detrás haga scroll cuando el usuario interactúa
// con el modal (sobre todo en móvil — touch events se propagan al fondo).
//
// Además:
//   • Hace scroll-to-top en el container principal al bloquear (evita que el
//     modal aparezca "desalineado" si el usuario había bajado por la página)
//   • Añade data-modal-open="true" al <body> para que CSS pueda deshabilitar
//     elementos fixed externos (sidebar-toggle, navbars, FABs...) mientras
//     el modal está abierto
//   • Usa lock counter en window para soportar modales anidados

import { useEffect } from "react";

const LOCK_KEY = "__playerlink_scroll_lock_count__";
const STATE_KEY = "__playerlink_scroll_lock_state__";

// Selector de elementos internos con scroll propio que también debemos congelar
const INNER_SCROLL_SELECTOR = ".private-content";

const lock = () => {
    const count = window[LOCK_KEY] || 0;
    if (count === 0) {
        // Scroll-to-top antes de bloquear — evita que el modal aparezca
        // desalineado o que se quede "rallado" si la página estaba scrolleada
        try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch { /* noop */ }
        document.querySelectorAll(INNER_SCROLL_SELECTOR).forEach((el) => {
            try { el.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch { el.scrollTop = 0; }
        });

        // Guardar estilos originales una sola vez (primer modal)
        window[STATE_KEY] = {
            bodyOverflow: document.body.style.overflow,
            bodyPaddingRight: document.body.style.paddingRight,
            htmlOverflow: document.documentElement.style.overflow,
        };

        // Compensar la barra de scroll para evitar reflow horizontal
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.setAttribute("data-modal-open", "true");

        // Bloquear scrollers internos (.private-content, etc.)
        document.querySelectorAll(INNER_SCROLL_SELECTOR).forEach((el) => {
            el.dataset.scrollLockPrev = el.style.overflow || "";
            el.style.overflow = "hidden";
        });
    }
    window[LOCK_KEY] = count + 1;
};

const unlock = () => {
    const count = window[LOCK_KEY] || 0;
    if (count <= 1) {
        // Restaurar estilos originales al cerrar el último modal
        const state = window[STATE_KEY] || {};
        document.body.style.overflow = state.bodyOverflow || "";
        document.body.style.paddingRight = state.bodyPaddingRight || "";
        document.documentElement.style.overflow = state.htmlOverflow || "";
        document.body.removeAttribute("data-modal-open");

        document.querySelectorAll(INNER_SCROLL_SELECTOR).forEach((el) => {
            const prev = el.dataset.scrollLockPrev;
            if (prev !== undefined) {
                el.style.overflow = prev;
                delete el.dataset.scrollLockPrev;
            } else {
                el.style.overflow = "";
            }
        });

        window[LOCK_KEY] = 0;
        delete window[STATE_KEY];
    } else {
        window[LOCK_KEY] = count - 1;
    }
};

/**
 * Hook para bloquear el scroll del body cuando `active` es true.
 * Cleanup automático al desmontar o al pasar a false.
 *
 * @param {boolean} active — true para bloquear, false para liberar
 */
export const useBodyScrollLock = (active) => {
    useEffect(() => {
        if (!active) return;
        lock();
        return () => unlock();
    }, [active]);
};

export default useBodyScrollLock;
