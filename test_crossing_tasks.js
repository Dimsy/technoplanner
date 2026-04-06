// Тест для проверки логики определения задач, пересекающих границу спринта
console.log("=== Тест: Задачи, пересекающие границу спринта ===\n");

const CELL_SIZE = 50;
const SPRINT_WIDTH = 500;
const DATA_X_OFFSET = 50;

// Функция для проверки, пересекает ли задача границу спринта
const crossesSprintBoundary = (taskX, taskWeight) => {
    const visualX = taskX - DATA_X_OFFSET;
    const taskEnd = visualX + taskWeight;
    
    const startSprint = Math.floor(visualX / SPRINT_WIDTH);
    const endSprint = Math.floor(taskEnd / SPRINT_WIDTH);
    
    // Задача пересекает границу, если:
    // 1. Начинается и заканчивается в разных спринтах
    // 2. Или заканчивается точно на границе (taskEnd кратно SPRINT_WIDTH)
    return startSprint !== endSprint || (taskEnd % SPRINT_WIDTH === 0 && taskEnd > visualX);
};

// Функция для получения информации о спринтах задачи
const getTaskSprintInfo = (taskX, taskWeight) => {
    const visualX = taskX - DATA_X_OFFSET;
    const taskEnd = visualX + taskWeight;
    
    const startSprint = Math.floor(visualX / SPRINT_WIDTH);
    const endSprint = Math.floor(taskEnd / SPRINT_WIDTH);
    
    const crossesBoundary = startSprint !== endSprint || (taskEnd % SPRINT_WIDTH === 0 && taskEnd > visualX);
    
    // Если задача заканчивается точно на границе, корректируем endSprint
    const actualEndSprint = taskEnd % SPRINT_WIDTH === 0 ? endSprint : Math.max(startSprint, endSprint - 1);
    
    return {
        visualX,
        taskEnd,
        startSprint: startSprint + 1, // +1 для человекочитаемого формата
        endSprint: actualEndSprint + 1,
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
    console.log('');
});

// Тест с реальными данными из data.json
console.log("2. Анализ реальных задач из data.json:");

const realTasks = [
    { x: 550, weight: 300, name: "Ставить дедлайны на 'когда-нибудь'" },
    { x: 50, weight: 450, name: "Доказывать начальству, что Земля плоская" },
    { x: 550, weight: 500, name: "Писать код, который работает только по пятницам 13-го" },
    { x: 450, weight: 50, name: "Приходить на работу в пижаме" },
    { x: 1200, weight: 350, name: "Выполнять задачи из параллельной вселенной" },
    { x: 500, weight: 100, name: "Тестовая задача на границе" },
];

realTasks.forEach(task => {
    const crosses = crossesSprintBoundary(task.x, task.weight);
    const info = getTaskSprintInfo(task.x, task.weight);
    
    console.log(`${crosses ? '⚠️ ' : '✅'} ${task.name}`);
    console.log(`   data.x: ${task.x}, weight: ${task.weight}`);
    console.log(`   visualX: ${info.visualX}, спринты: ${info.startSprint}-${info.endSprint}`);
    console.log(`   Пересекает границу: ${crosses ? 'ДА (будет прозрачной)' : 'НЕТ'}`);
    console.log('');
});

console.log("3. Рекомендации по визуализации:");
console.log("- Задачи, пересекающие границу спринта: opacity: 0.7");
console.log("- Задачи полностью в одном спринте: opacity: 1.0");
console.log("- Подсказка для пересекающих задач: '⚠️ Задача пересекает границу спринта X-Y'");
console.log("- Цвет остается прежним, меняется только прозрачность");

// Проверка граничных случаев
console.log("\n4. Граничные случаи:");
const edgeCases = [
    { x: 500, weight: 1, description: "Задача начинается точно на границе, длиной 1px" },
    { x: 499, weight: 1, description: "Задача заканчивается точно на границе" },
    { x: 500, weight: 500, description: "Задача начинается на границе и занимает весь следующий спринт" },
    { x: 0, weight: 1000, description: "Задача начинается в начале и пересекает границу" },
];

edgeCases.forEach(case_ => {
    // Для теста используем data.x = visualX + DATA_X_OFFSET
    const dataX = case_.x + DATA_X_OFFSET;
    const crosses = crossesSprintBoundary(dataX, case_.weight);
    console.log(`${crosses ? '⚠️ ' : '✅'} ${case_.description}`);
    console.log(`   data.x: ${dataX}, weight: ${case_.weight}, пересекает: ${crosses}`);
});