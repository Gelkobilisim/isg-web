export const triggerHaptic = (type = 'success') => {
    if (typeof window === 'undefined' || !("vibrate" in navigator)) return;
    try {
        if (Array.isArray(type)) {
            navigator.vibrate(type);
            return;
        }
        switch(type) {
            case 'light':
                // Subtle micro-tap for standard buttons, tabs, switches
                navigator.vibrate(8);
                break;
            case 'tap':
            case 'selection':
                // Single light tap
                navigator.vibrate(12);
                break;
            case 'medium':
                // Noticeable tap for starting operations, opening forms
                navigator.vibrate(18);
                break;
            case 'success':
                // Crisp double-tap for successful saves, resolutions, audits
                navigator.vibrate([12, 45, 16]);
                break;
            case 'warning':
                // Alert pattern for objections, rejections
                navigator.vibrate([25, 35, 25]);
                break;
            case 'error':
                // Sharp buzz pattern for validation failures and security rejections
                navigator.vibrate([35, 30, 35, 30, 45]);
                break;
            case 'heavy':
                // Deep buzz for deletions or reset operations
                navigator.vibrate(40);
                break;
            default:
                navigator.vibrate(12);
        }
    } catch(e) {
        console.warn("Haptic feedback error:", e);
    }
};
