export const formatDisplayText = (value: string): string => {
    if (!value) {
        return '';
    }

    const spaced = value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .trim();

    if (!spaced) {
        return '';
    }

    const lower = spaced.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};
