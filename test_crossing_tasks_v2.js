// Тест для проверки улучшенной логики определения задач, пересекающих границу спринта
console.log("=== Тест: Улучшенная логика для задач, пересекающих границу спринта ===\n");

const CELL_SIZE = 50;
const SPRINT_WIDTH = 500;
const DATA_X_OFFSET = 50;
const TOTAL_WIDTH = 26 * SPRINT_WIDTH; // 13000px

// Улучшенная функция для проверки, пересекает ли задача границу спринта
const crossesSprintBoundary = (taskX, taskWeight) => {
    const visualX = taskX - DATA_X_OFFSET;
    const taskEnd = visualX + taskWeight;
    
    const startSprint = Math.floor(visualX / SPRINT_WIDTH);
    const endSprint = Math.floor((taskEnd - 1) / SPRINT_WIDTH); // -1 чтобы задача, заканчивающаяся на границе, считалась в предыдущем спринте
    
    // Задача пересекает границу, если начинается и заканчивается в разных спринтах
    let crosses = startSprint !== endSprint;
    
    // Дополнительная проверка: задача пересекает границу, если она проходит через границу спринта
    // Границы спринтов находятся на позициях, кратных SPRINT_WIDTH
    for (let boundary = 0; boundary <= TOTAL_WIDTH; boundary += SPRINT_WIDTH) {
        if (boundary > visualX && boundary < taskEnd) {
            return true;
        }
    }
    
    return crosses;
};

// Функция для получения информации о спринтах задачи
const getTaskSprintInfo = (taskX, taskWeight) => {
    const visualX = taskX - DATA_X_OFFSET;
    const taskEnd = visualX + taskWeight;
    
    const startSprint = Math.floor(visualX / SPRINT_WIDTH);
    const endSprint = Math.floor((taskEnd - 1) / SPRINT_WIDTH);
    
    const crossesBoundary = crossesSprintBoundary(taskX, taskWeight);
    
    return {
        visualX,
        taskEnd,
        startSprint: startSprint + 1, // +1 для человекочитаемого формата
        endSprint: endSprint + 1,
        crossesBoundary
    };
};

// Тестовые задачи
const testTasks = [
    { name: "Задача полностью в спринте 1", x: 550, weight: 300, expectedCrosses: false },
    { name: "Задача полностью в спринте 0", x: 50, weight: 450, expectedCrosses: false },
    { name: "Задача на границе спринтов 0-1", x: 500, weight: 100, expectedCrosses: true },
    { name: "Задача на границе спринтов 0-1 (маленькая)", x: 499, weight: 2, expectedCrosses: true },
    { name: "Большая задача через несколько спринтов", x: 450, weight: 600, expectedCrosses: true },
    { name: "Задача в конце спринта 0", x: 450, weight: 50, expectedCrosses: false },
    { name: "Задача в начале спринта 1", x: 550, weight: 50, expectedCrosses: false },
    { name: "Задача заканчивается точно на границе", x: 450, weight: 50, expectedCrosses: false }, // 400-450px
    { name: "Задача начинается точно на границе", x: 500, weight: 50, expectedCrosses: true }, // 450-500px
];

console.log("1. Проверка пересечения границ спринтов:");
testTasks.forEach((task, i) => {
    const crosses = crossesSprintBoundary(task.x, task.weight);
    const info = getTaskSprintInfo(task.x, task.weight);
    
    const status = crosses === task.expectedCrosses ? '✅' : '❌';
    console.log(`${status} ${task.name}`);
    console.log(`   data.x: ${task.x}, weight: ${task.weight}, SP: ${task.weight / CELL_SIZE}`);
    console.log(`   visualX: ${info.visualX}, taskEnd: ${info.taskEnd}`);
    console.log(`   Спринты: ${info.startSprint}-${info.endSprint}`);
    console.log(`   Пересекает границу: ${crosses} (ожидалось: ${task.expectedCrosses})`);
    
    // Показываем, через какие границы проходит задача
    const visualX = task.x - DATA_X_OFFSET;
    const taskEnd = visualX + task.weight;
    const boundaries = [];
    for (let boundary = 0; boundary <= TOTAL_WIDTH; boundary += SPRINT_WIDTH) {
        if (boundary > visualX && boundary < taskEnd) {
            boundaries.push(boundary);
        }
    }
    if (boundaries.length > 0) {
        console.log(`   Проходит через границы: ${boundaries.join(', ')}px`);
    }
    console.log('');
});

// Визуализация примера
console.log("2. Визуализация примера задачи на границе:");
const exampleTask = { x: 499, weight: 2, name: "Маленькая задача на границе" };
const exampleVisualX = exampleTask.x - DATA_X_OFFSET;
const exampleTaskEnd = exampleVisualX + exampleTask.weight;

console.log(`Задача: ${exampleTask.name}`);
console.log(`data.x: ${exampleTask.x}, weight: ${exampleTask.weight}`);
console.log(`visualX: ${exampleVisualX}px, taskEnd: ${exampleTaskEnd}px`);
console.log(`Граница спринта: 450px`);
console.log(`Задача проходит через позицию 450px? ${exampleVisualX < 450 && exampleTaskEnd > 450 ? 'ДА ✅' : 'НЕТ'}`);
console.log(`Пересекает границу спринта: ${crossesSprintBoundary(exampleTask.x, exampleTask.weight) ? 'ДА (будет прозрачной)' : 'НЕТ'}`);

console.log("\n3. Как это будет выглядеть в интерфейсе:");
console.log("- Задачи, пересекающие границу: opacity: 0.7 (полупрозрачные)");
console.log("- Подсказка: '⚠️ Задача пересекает границу спринта X-Y'");
console.log("- Пример подсказки: 'TASK-1: Название задачи (SP: 5)\n⚠️ Задача пересекает границу спринта 1-2\nЗадача не будет полностью готова в одном спринте'");

// Проверка производительности
console.log("\n4. Проверка производительности (граничные случаи):");
const performanceTest = [
    { x: 50, weight: 12950, description: "Задача через все спринты" },
    { x: 500, weight: 1, description: "Задача длиной 1px на границе" },
    { x: 499, weight: 1, description: "Задача длиной 1px перед границей" },
    { x: 501, weight: 1, description: "Задача длиной 1px после границы" },
];

performanceTest.forEach(test => {
    const startTime = performance.now();
    const crosses = crossesSprintBoundary(test.x, test.weight);
    const endTime = performance.now();
    
    console.log(`${crosses ? '⚠️ ' : '✅'} ${test.description}`);
    console.log(`   Время выполнения: ${(endTime - startTime).toFixed(3)}ms`);
});