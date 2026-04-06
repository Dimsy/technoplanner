import React from 'react';

const LEFT_PANEL_WIDTH = 220;
const ROW_HEIGHT = 50;
const SPRINT_WIDTH = 500; // 10 ячеек × 50px
const DATA_X_OFFSET = 50; // Смещение координат X в данных

// Функция для получения визуальной координаты из координаты в данных
const getVisualX = (dataX) => {
    return dataX - DATA_X_OFFSET;
};

// Функция для правильного склонения слова "задача"
const getTaskWord = (count) => {
    if (count === 0) return 'задач';
    if (count === 1) return 'задача';
    if (count >= 2 && count <= 4) return 'задачи';
    return 'задач';
};

const PeopleList = ({ people, tasks, selectedSprint, onAddPerson, onAddTask, onEditPerson, onResetSprintSelection }) => {
    // Функция для проверки, попадает ли задача в выбранный спринт
    const isTaskInSelectedSprint = (taskX, taskWidth) => {
        if (selectedSprint === null) return true; // Все спринты
        
        // Преобразуем координаты из системы данных в визуальные
        const visualTaskX = getVisualX(taskX);
        const visualTaskEnd = visualTaskX + taskWidth;
        
        const sprintStart = selectedSprint * SPRINT_WIDTH;
        const sprintEnd = (selectedSprint + 1) * SPRINT_WIDTH;
        
        // Задача попадает в спринт, если хотя бы часть задачи находится внутри спринта
        // Используем эксклюзивные границы для правой стороны
        return (visualTaskX < sprintEnd && visualTaskEnd > sprintStart);
    };

    const taskCounts = people.map((person, idx) => {
        const rowY = idx * ROW_HEIGHT;
        return Object.values(tasks).filter(task => {
            // Проверяем назначение на человека
            const isAssigned = task.assignee === person.id || Math.abs(task.y - rowY) < 5;
            if (!isAssigned) return false;
            
            // Проверяем, попадает ли задача в выбранный спринт
            return isTaskInSelectedSprint(task.x, task.weight);
        }).length;
    });

    const taskSPs = people.map((person, idx) => {
        const rowY = idx * ROW_HEIGHT;
        const personTasks = Object.values(tasks).filter(task => {
            // Проверяем назначение на человека
            const isAssigned = task.assignee === person.id || Math.abs(task.y - rowY) < 5;
            if (!isAssigned) return false;
            
            // Проверяем, попадает ли задача в выбранный спринт
            return isTaskInSelectedSprint(task.x, task.weight);
        });
        
        // Суммируем SP всех задач человека в выбранном спринте
        // Для задач, которые частично в спринте, считаем только часть SP
        const totalSP = personTasks.reduce((total, task) => {
            if (selectedSprint === null) {
                return total + (task.sp || 0); // Все SP, если не выбран спринт
            }
            
            const sprintStart = selectedSprint * SPRINT_WIDTH;
            const sprintEnd = (selectedSprint + 1) * SPRINT_WIDTH;
            
            // Преобразуем координаты задачи в визуальные
            const visualTaskStart = getVisualX(task.x);
            const visualTaskEnd = visualTaskStart + task.weight;
            
            // Вычисляем, какая часть задачи попадает в спринт
            // Используем эксклюзивные границы для правой стороны
            const overlapStart = Math.max(visualTaskStart, sprintStart);
            const overlapEnd = Math.min(visualTaskEnd, sprintEnd);
            const overlapWidth = Math.max(0, overlapEnd - overlapStart);
            
            // Вычисляем долю SP, пропорциональную части задачи в спринте
            const taskSP = task.sp || 0;
            const taskTotalWidth = task.weight;
            const overlapSP = taskSP * (overlapWidth / taskTotalWidth);
            
            // Отладочная информация
            if (person.name === 'Елена Еленова' && selectedSprint === 0) {
                console.log(`Задача для Елены: sp=${taskSP}, x=${visualTaskStart}, width=${taskTotalWidth}, overlap=${overlapWidth}, overlapSP=${overlapSP.toFixed(2)}`);
            }
            
            return total + overlapSP;
        }, 0);
        
        // Отладочная информация для Елены Еленовой
        if (person.name === 'Елена Еленова' && selectedSprint === 0) {
            console.log(`Елена Еленова: totalSP=${totalSP}, процент=${(totalSP / 10 * 100).toFixed(1)}%`);
            console.log('Задачи Елены:', personTasks);
        }
        
        return totalSP;
    });

    return (
        <div style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            width: LEFT_PANEL_WIDTH + 'px', 
            height: '100vh', 
            backgroundColor: '#2c3e50', 
            zIndex: 800,
            boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
            overflowY: 'hidden'
        }}>
            <div style={{ 
                height: 50, 
                lineHeight: '50px', 
                fontWeight: 'bold', 
                textAlign: 'center', 
                borderBottom: '2px solid #34495e',
                backgroundColor: '#1a252f',
                color: '#ecf0f1',
                fontSize: '16px',
                letterSpacing: '0.5px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                👥 Список людей
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
                {people.map((person, idx) => {
                    const assignedTasks = taskCounts[idx];
                    const isEvenRow = idx % 2 === 0;
                    
                    return (
                        <div 
                            key={person.id} 
                            style={{
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #34495e',
                                padding: '0 15px',
                                backgroundColor: isEvenRow ? '#2c3e50' : '#243342',
                                transition: 'background-color 0.2s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                boxSizing: 'border-box'
                            }}
                            onClick={() => onEditPerson && onEditPerson(person)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEvenRow ? '#2c3e50' : '#243342'}
                        >
                            {/* Номер строки для лучшего соответствия с рядами */}
                            <div style={{
                                position: 'absolute',
                                left: '5px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '20px',
                                height: '20px',
                                backgroundColor: assignedTasks > 0 ? 
                                    (taskSPs[idx] >= 10 ? '#e74c3c' : 
                                     taskSPs[idx] >= 7 ? '#f39c12' : '#2ecc71') : '#7f8c8d',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                color: '#fff'
                            }}>
                                {idx + 1}
                            </div>
                            
                            <span style={{ 
                                marginLeft: '30px',
                                color: '#ecf0f1',
                                fontWeight: '500',
                                fontSize: '14px'
                            }}>
                                {person.name}
                            </span>
                            
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'flex-end'
                            }}>
                                <span style={{ 
                                    fontSize: '12px', 
                                    color: assignedTasks > 0 ? '#2ecc71' : '#bdc3c7',
                                    fontWeight: assignedTasks > 0 ? 'bold' : 'normal'
                                }}>
                                    {assignedTasks} {getTaskWord(assignedTasks)}
                                </span>
                                {assignedTasks > 0 && selectedSprint !== null && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        marginTop: '2px'
                                    }}>
                                        {/* Прогресс-бар занятости */}
                                        <div style={{
                                            width: '40px',
                                            height: '4px',
                                            backgroundColor: '#34495e',
                                            borderRadius: '2px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${Math.min(100, (taskSPs[idx] / 10) * 100)}%`,
                                                height: '100%',
                                                backgroundColor: taskSPs[idx] >= 10 ? '#e74c3c' : 
                                                               taskSPs[idx] >= 7 ? '#f39c12' : '#2ecc71',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <span style={{
                                            fontSize: '9px',
                                            color: taskSPs[idx] >= 10 ? '#e74c3c' : 
                                                   taskSPs[idx] >= 7 ? '#f39c12' : '#2ecc71',
                                            fontWeight: 'bold',
                                            minWidth: '20px',
                                            textAlign: 'right'
                                        }}>
                                            {Math.round((taskSPs[idx] / 10) * 100)}%
                                            {person.name === 'Елена Еленова' && selectedSprint === 0 && (
                                                <span style={{ fontSize: '6px', color: '#95a5a6', marginLeft: '2px' }}>
                                                    ({taskSPs[idx].toFixed(1)} SP = {(taskSPs[idx] / 10 * 100).toFixed(1)}%)
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {/* Кнопка сброса выбора спринта */}
                {selectedSprint !== null && onResetSprintSelection && (
                    <div 
                        style={{
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTop: '2px solid #34495e',
                            backgroundColor: '#1a252f',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box',
                            marginTop: '10px'
                        }}
                        onClick={onResetSprintSelection}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e74c3c';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a252f';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <span style={{
                                color: '#e74c3c',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}>↺</span>
                            <span style={{
                                color: '#ecf0f1',
                                fontWeight: '500',
                                fontSize: '12px'
                            }}>
                                Показать все спринты
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Кнопка добавления человека */}
                {onAddPerson && (
                    <div 
                        style={{
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTop: '2px solid #34495e',
                            backgroundColor: '#1a252f',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box'
                        }}
                        onClick={onAddPerson}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#27ae60';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a252f';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <span style={{
                                color: '#2ecc71',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>+</span>
                            <span style={{
                                color: '#ecf0f1',
                                fontWeight: '500',
                                fontSize: '14px'
                            }}>
                                Добавить человека
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Кнопка добавления задачи */}
                {onAddTask && (
                    <div 
                        style={{
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTop: '2px solid #34495e',
                            backgroundColor: '#1a252f',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'sticky',
                            bottom: 0,
                            boxSizing: 'border-box'
                        }}
                        onClick={onAddTask}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#3498db';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a252f';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <span style={{
                                color: '#3498db',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>+</span>
                            <span style={{
                                color: '#ecf0f1',
                                fontWeight: '500',
                                fontSize: '14px'
                            }}>
                                Добавить задачу
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PeopleList;