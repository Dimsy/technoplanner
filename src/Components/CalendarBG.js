import { useEffect, useState } from 'react';

export const CalendarBG = ({children, data, selectedSprint, onSprintSelect}) => {
    const [sprintInfosT, setSprintInfosT] = useState([]);
    const [sprintInfosS, setSprintInfosS] = useState([]);
    const GRID_TOP_OFFSET = 50;
    const CELL_SIZE = 50;
    const SPRINT_WIDTH = 500; // 10 ячеек × 50px
    const TOTAL_SPRINTS = 26;
    const TOTAL_WIDTH = TOTAL_SPRINTS * SPRINT_WIDTH; // 13000px
    const DATA_X_OFFSET = 50; // Смещение координат X в данных

    // Функция для получения визуальной координаты из координаты в данных
    const getVisualX = (dataX) => {
        return dataX - DATA_X_OFFSET;
    };

    const bgStyle = {
        position: 'absolute',
        width: TOTAL_WIDTH + 'px', // 26 спринтов × 500px
        height: 'calc(100vh - 50px)' // Высота окна минус высота заголовка спринтов
    };
    const cols = TOTAL_SPRINTS * 10; // 26 спринтов × 10 ячеек в спринте
    const rows = 15; // Фиксированное количество строк (12 людей + 3 запаса)

    useEffect(() => {
        const sprintsCount = 26; // Всегда 26 спринтов
        const isprintInfosT = [];
        const isprintInfosS = [];

        for (let i=0; i< sprintsCount; i++){
            let tasks = 0;
            let sp = 0;
            Object.keys(data).forEach((key) => {
                const task = data[key];
                // Преобразуем координаты задачи в визуальные
                const visualTaskStart = getVisualX(task.x);
                const visualTaskEnd = visualTaskStart + task.weight;
                const sprintStart = i * SPRINT_WIDTH;
                const sprintEnd = (i + 1) * SPRINT_WIDTH;
                
                // Проверяем, пересекается ли задача со спринтом
                if (visualTaskStart < sprintEnd && visualTaskEnd > sprintStart) {
                    // Вычисляем часть задачи, которая находится в спринте
                    const overlapStart = Math.max(visualTaskStart, sprintStart);
                    const overlapEnd = Math.min(visualTaskEnd, sprintEnd);
                    const overlapWidth = Math.max(0, overlapEnd - overlapStart);
                    
                    // Добавляем SP пропорционально части задачи в спринте
                    sp = sp + overlapWidth / CELL_SIZE;
                    tasks = tasks + 1;
                }
            })
            isprintInfosT.push(tasks);
            isprintInfosS.push(sp);
        }
        setSprintInfosT(isprintInfosT)
        setSprintInfosS(isprintInfosS)
    },[data]);

    const renderDivs = () => {
        const rcols = [];
        for (let i=0; i<= rows; i++) {
            const rrows = [];
            for (let j=0; j< cols; j++) {
                const isSprintBoundary = (j + 1) % 10 === 0; // j+1 потому что теперь j начинается с 0
                rrows.push(<div key={`cell-${i}-${j}`} style={{
                    height: CELL_SIZE,
                    width: CELL_SIZE,
                    position: 'absolute',
                    top: GRID_TOP_OFFSET + i*CELL_SIZE,
                    left: j*CELL_SIZE, // Убрал LEFT_PANEL_WIDTH
                    opacity: 0.6,
                    border: '1px solid lightGrey',
                    borderRight: isSprintBoundary ? '3px solid #3498db' : '1px solid lightGrey',
                    boxSizing: 'border-box',
                    '-moz-box-sizing': 'border-box',
                    '-webkit-box-sizing': 'border-box',
                    backgroundColor: 'white',
                    zIndex: 0
                }}></div>)
            }
            rcols.push(...rrows) // Spread вместо push
        }
        return rcols
    };

    return (
        <div style={bgStyle}>
            {sprintInfosT.map((task,i) => <div 
                key={i} 
                style={{
                    position: 'absolute',
                    left: i*10*CELL_SIZE, // Начинаем с 0, а не с 50
                    top: 0,
                    width: SPRINT_WIDTH + 'px', // 10 ячеек × 50px
                    height: CELL_SIZE + 'px', // Высота ячейки
                    backgroundColor: selectedSprint === i ? '#ecf0f1' : '#1a252f',
                    color: '#ecf0f1',
                    padding: '0 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    borderLeft: selectedSprint === i ? '3px solid #3498db' : '2px solid #3498db',
                    borderRight: selectedSprint === i ? '3px solid #3498db' : '2px solid #3498db',
                    borderBottom: selectedSprint === i ? '3px solid #2c3e50' : '2px solid #2c3e50',
                    textAlign: 'center',
                    zIndex: 700,
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onClick={() => {
                    if (onSprintSelect) {
                        // Если кликаем на уже выбранный спринт - снимаем выделение
                        if (selectedSprint === i) {
                            onSprintSelect(null);
                        } else {
                            onSprintSelect(i);
                        }
                    }
                }}
                onMouseEnter={(e) => {
                    if (selectedSprint !== i) {
                        e.currentTarget.style.backgroundColor = '#2c3e50';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (selectedSprint !== i) {
                        e.currentTarget.style.backgroundColor = '#1a252f';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                        color: selectedSprint === i ? '#1a252f' : '#3498db', 
                        fontWeight: 'bold',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {selectedSprint === i ? '✅' : '📊'} Спринт {i+1}
                    </span>
                    <span style={{ 
                        fontSize: '11px', 
                        color: selectedSprint === i ? '#1a252f' : '#95a5a6',
                        backgroundColor: selectedSprint === i ? '#ecf0f1' : '#2c3e50',
                        padding: '2px 6px',
                        borderRadius: '3px'
                    }}>#{i+1}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ 
                        color: selectedSprint === i ? '#1a252f' : '#2ecc71',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{ fontSize: '10px' }}>📋</span> {task} задач
                    </span>
                    <span style={{ 
                        color: selectedSprint === i ? '#1a252f' : '#e74c3c',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{ fontSize: '10px' }}>⚡</span> {sprintInfosS[i]} SP
                    </span>
                </div>
            </div>)}
            {renderDivs()}
            {children.map((child) => child)}
        </div>
    )
};
