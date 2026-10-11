function deepCompare(obj1, obj2) {
    if (obj1 === obj2) return true; // Handles primitives and same object reference

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false; // Not objects or one is null
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}

export function compareArrayOfObjects(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (!deepCompare(arr1[i], arr2[i])) {
            return false;
        }
    }
    return true;
}