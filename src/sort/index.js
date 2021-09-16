export const bubbleSort = async (items, options) => {
    for (let i = 0; i < items.length; i++) {
        items.trackIndex("end", () => items.length - i - 1);
        for (let j = 0; j < items.length - i - 1; j++) {
            items.trackIndex("j", () => j);
            items.trackIndex("j+1", () => j + 1);
            if (await items.compareAtIndex(j, j + 1) > 0) {
                await items.swap(j, j + 1);
            }
            await options.onStepCompleted();
        }
    }
}

export const selectionSort = async (items, options) => {
    for (let i = 0; i < items.length - 1; i++) {
        items.trackIndex("i", () => i);
        let minValueIndex = i;
        items.trackIndex("min", () => minValueIndex);
        for (let j = i + 1; j < items.length; j++) {
            items.trackIndex("j", () => j);
            if (await items.compareAtIndex(minValueIndex, j) > 0) {
                minValueIndex = j;
            }
            await options.onStepCompleted();
        }
        await items.swap(i, minValueIndex);
    }
}
