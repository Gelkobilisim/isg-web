export const triggerHaptic = (type = 'success') => {
    if (typeof window === 'undefined' || !("vibrate" in navigator)) return;
    try {
        switch(type) {
            case 'success':
                // Double light tap
                navigator.vibrate([15, 50, 15]);
                break;
            case 'error':
                // Fast buzz
                navigator.vibrate([50, 50, 50, 50, 50]);
                break;
            case 'tap':
                // Single light tap
                navigator.vibrate(10);
                break;
            case 'heavy':
                // Single heavy buzz
                navigator.vibrate(40);
                break;
            default:
                navigator.vibrate(15);
        }
    } catch(e) {
        console.warn("Haptic feedback error:", e);
    }
};
