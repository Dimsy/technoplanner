// Отладка логики пересечения границы
console.log("=== Отладка логики пересечения границы ===\n");

const SPRINT_WIDTH = 500;
const DATA_X_OFFSET = 50;
const TOTAL_WIDTH = 26 * SPRINT_WIDTH; // 13000px

// Тестовая задача: data.x = 499, weight = 2
const taskX = 499;
const taskWeight = 2;

const visualX = taskX - DATA_X_OFFSET;
const taskEnd = visualX + taskWeight;

console.log(`Задача: data.x=${taskX}, weight=${taskWeight}`);
console.log(`visualX=${visualX}, taskEnd=${taskEnd}`);
console.log(`Граница спринта: 450px`);
console.log(`Проверка: 450 > ${visualX} && 450 < ${taskEnd} = ${450 > visualX && 450 < taskEnd}`);

// Логика из TimeElement.js
const startSprint = Math.floor(visualX / SPRINT_WIDTH);
const endSprint = Math.floor((taskEnd - 1) / SPRINT_WIDTH);

console.log(`\nstartSprint = Math.floor(${visualX} / ${SPRINT_WIDTH}) = ${startSprint}`);
console.log(`endSprint = Math.floor((${taskEnd} - 1) / ${SPRINT_WIDTH}) = Math.floor(${taskEnd - 1} / ${SPRINT_WIDTH}) = ${endSprint}`);
console.log(`startSprint !== endSprint: ${startSprint} !== ${endSprint} = ${startSprint !== endSprint}`);

// Проверка границ в цикле
console.log("\nПроверка границ в цикле:");
let foundBoundary = false;
for (let boundary = 0; boundary <= TOTAL_WIDTH; boundary += SPRINT_WIDTH) {
    const condition = boundary > visualX && boundary < taskEnd;
    console.log(`  boundary=${boundary}: ${boundary} > ${visualX} && ${boundary} < ${taskEnd} = ${condition}`);
    if (condition) {
        foundBoundary = true;
        console.log(`  ^ Найдена пересекаемая граница!`);
    }
}

console.log(`\nРезультат:`);
console.log(`- startSprint !== endSprint: ${startSprint !== endSprint}`);
console.log(`- Найдена граница в цикле: ${foundBoundary}`);
console.log(`- Итог (crosses): ${(startSprint !== endSprint) || foundBoundary}`);

// Упрощенная логика
console.log("\n=== Упрощенная логика ===");
console.log("Задача пересекает границу спринта, если:");
console.log("1. visualX и taskEnd находятся в разных спринтах");
console.log("2. ИЛИ существует граница B, такая что: visualX < B < taskEnd");
console.log(`\nДля нашей задачи:`);
console.log(`1. visualX=${visualX} в спринте ${startSprint}, taskEnd=${taskEnd} в спринте ${Math.floor(taskEnd / SPRINT_WIDTH)}`);
console.log(`2. Граница 450px: ${visualX} < 450 < ${taskEnd} = ${visualX < 450 && 450 < taskEnd}`);

// Альтернативный подход
console.log("\n=== Альтернативный подход ===");
const crossesBoundarySimple = () => {
    // Проверяем, проходит ли задача через любую границу спринта
    for (let boundary = 0; boundary <= TOTAL_WIDTH; boundary += SPRINT_WIDTH) {
        if (boundary > visualX && boundary < taskEnd) {
            return true;
        }
    }
    // Проверяем, находятся ли начало и конец в разных спринтах
    return Math.floor(visualX / SPRINT_WIDTH) !== Math.floor((taskEnd - 0.001) / SPRINT_WIDTH);
};

console.log(`Упрощенная функция возвращает: ${crossesBoundarySimple()}`);