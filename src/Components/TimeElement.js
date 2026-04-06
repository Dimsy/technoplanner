import '../App.css';
import { useState, useEffect } from 'react';

// value === key!11
export const TimeElement = ({el, value, x, y, setSmthDragging, updater, data, setSmthEditing, deleter, onEdit}) => {
    const LEFT_PANEL_WIDTH = 220;
    const GRID_TOP_OFFSET = 50;
    const CELL_SIZE = 50;
    const SPRINT_WIDTH = 500; // 10 ячеек × 50px
    const TOTAL_SPRINTS = 26;
    const TOTAL_WIDTH = TOTAL_SPRINTS * SPRINT_WIDTH; // 13000px
    const DATA_X_OFFSET = 50; // Смещение координат X в данных

    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({x: 0, y: 0});
    const [position, setPosition] = useState({x: el.x, y: el.y});
    const [weight, setWeight] = useState(el.weight);

    // Синхронизируем состояние с пропсами при их изменении
    useEffect(() => {
        setPosition({x: el.x, y: el.y});
        setWeight(el.weight);
    }, [el.x, el.y, el.weight]);

    // Отслеживаем мышь при перетаскивании
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            setDragPosition({x: e.clientX, y: e.clientY});
        };

        const handleTouchMove = (e) => {
            const touch = (e.originalEvent ?? e).touches[0]
                ?? (e.originalEvent ?? e).changedTouches[0];
            setDragPosition({x: touch.pageX, y: touch.pageY});
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isDragging]);

    // Функция для проверки, пересекает ли задача границу спринта
    const crossesSprintBoundary = () => {
        const visualX = position.x - DATA_X_OFFSET;
        const taskEnd = visualX + weight;
        
        const startSprint = Math.floor(visualX / SPRINT_WIDTH);
        const endSprint = Math.floor((taskEnd - 0.001) / SPRINT_WIDTH); // -0.001 чтобы задача, заканчивающаяся точно на границе, считалась в предыдущем спринте
        
        // Задача пересекает границу спринта, если начинается и заканчивается в разных спринтах
        // Границы спринтов находятся на позициях, кратных SPRINT_WIDTH (0, 500, 1000, ...)
        return startSprint !== endSprint;
    };

    const getColor = (type) => {
        switch (type) {
            case 'none':     return 'lightGrey';
            case 'Высший': return '#E57373'; // red[300]
            case 'Высокий': return '#FFB74D'; // orange[300]
            case 'Средний': return '#81C784'; // green[300]
            case 'Низкий': return '#64B5F6'; // blue[300]
            default:         return 'lightGrey';
        }
    };

    /**
     * Находит все элементы на той же строке (y), которые пересекаются
     * с диапазоном [newX .. newX + currentWeight], исключая сам перетаскиваемый элемент.
     *
     * Пересечение по X: два отрезка [a, a+wa] и [b, b+wb] пересекаются,
     * если a < b+wb && a+wa > b.
     */
    const findCollisions = (newX, newY, currentWeight) => {
        return Object.keys(data)
            .filter((key) => {
                if (key === value) return false; // пропускаем себя (по ключу)
                const other = data[key];
                if (other.y !== newY) return false; // другая строка
                // AABB пересечение по оси X (строгое — касание не считается коллизией)
                return newX < other.x + other.weight && newX + currentWeight > other.x;
            })
            .map((key) => ({ key, ...data[key] }));
    };

    /**
     * Снэппинг к сетке + разрешение коллизий.
     * При наличии пересечения — ставим элемент ПОСЛЕ самого правого блокирующего элемента.
     */
    const snapPositionToRow = (rawX, rawY) => {
        // Снэппинг к сетке 50px
        // rawX - координата мыши относительно окна
        // Контейнер начинается в 220px от левого края (ширина панели людей)
        const containerOffset = LEFT_PANEL_WIDTH;
        let newX = Math.floor((rawX - containerOffset) / CELL_SIZE) * CELL_SIZE;
        if (newX < 0) newX = 0;
        let newY = Math.floor((rawY - GRID_TOP_OFFSET) / CELL_SIZE) * CELL_SIZE;
        if (newY < 0) newY = 0;

        // Проверяем, не начинается ли задача на границе спринта
        // Граница спринта - каждая 10-я ячейка (visualX кратно SPRINT_WIDTH)
        const visualX = newX;
        if (visualX % SPRINT_WIDTH === 0 && visualX > 0) {
            // Сдвигаем задачу на одну ячейку влево, чтобы она не начиналась на границе
            newX = visualX - CELL_SIZE;
        }

        // Проверяем коллизии и сдвигаем элемент вправо за крайний блокирующий блок
        // findCollisions ожидает координаты со смещением DATA_X_OFFSET
        const collisions = findCollisions(newX + DATA_X_OFFSET, newY, weight);

        if (collisions.length > 0) {
            // Находим правый край самого правого пересекающегося элемента
            const rightmostEdge = Math.max(...collisions.map((c) => c.x + c.weight));
            newX = rightmostEdge - DATA_X_OFFSET; // Вычитаем смещение
            
            // Снова проверяем границу спринта после сдвига
            const newVisualX = newX;
            if (newVisualX % SPRINT_WIDTH === 0 && newVisualX > 0) {
                newX = newVisualX - CELL_SIZE;
            }
        }

        // Проверяем, не пересекается ли элемент с другими после сдвига
        const newCollisions = findCollisions(newX + DATA_X_OFFSET, newY, weight);
        if (newCollisions.length > 0) {
            alert("Недостаточно SP!");
            return; // Не перемещаем элемент
        }

        // Проверяем, помещается ли элемент в новое место
        // Учитываем смещение DATA_X_OFFSET
        if (newX + DATA_X_OFFSET + weight > TOTAL_WIDTH) {
            alert("Недостаточно SP!");
            return; // Не перемещаем элемент
        }

        // Добавляем DATA_X_OFFSET к координате X для совместимости со старыми данными
        updater(value, { value: el.value, x: newX + DATA_X_OFFSET, y: newY, weight, type: el.type, key: el.key, sp: el.sp });
        setPosition({ x: newX + DATA_X_OFFSET, y: newY });
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.button !== 2) {
            setIsDragging(false);
            // Компенсируем смещение для позиционирования курсора в середине по вертикали с отступом слева
            snapPositionToRow(dragPosition.x - 20, dragPosition.y - 25);
        }
    };

    const handleScroll = (e) => {
        let newSp = el.sp;

        if (e.deltaY < 0) {
            // Расширяем вправо — проверяем, не заблокировано ли место
            const newWeight = (el.sp + 1) * CELL_SIZE;
            // Проверяем, не выходит ли задача за правую границу
            if (position.x + newWeight > TOTAL_WIDTH) {
                alert("Недостаточно SP!");
                return;
            }
            const collisions = findCollisions(position.x, position.y, newWeight);
            if (collisions.length === 0) {
                newSp = el.sp + 1;
            }
        } else if (e.deltaY > 0) {
            newSp = Math.max(1, el.sp - 1);
        }

        const newWeight = newSp * CELL_SIZE;
        setWeight(newWeight);
        updater(value, { value: el.value, x: position.x, y: position.y, weight: newWeight, type: el.type, key: el.key, sp: newSp });
    };

    const positionStyle = {
        height: 50,
        width: el.sp * 50,
        position: 'absolute',
        backgroundColor: getColor(el.type),
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
        opacity: crossesSprintBoundary() ? 0.7 : 1, // Прозрачность для задач, пересекающих границу спринта
        zIndex: isDragging ? 1000 : 1,
        boxSizing: 'border-box'
    };

    if (isDragging) {
        positionStyle.position = 'fixed';
        positionStyle.top = dragPosition.y - 25;
        positionStyle.left = dragPosition.x - 20;
    } else {
        positionStyle.position = 'absolute';
        positionStyle.top = GRID_TOP_OFFSET + position.y;
        positionStyle.left = Math.max(0, position.x - 50); // Компенсируем смещение ячеек
    }

    const toggleEdit = (e) => {
        e.stopPropagation();
        onEdit(value, el);
    };

    const deleteElement = (e) => {
        e.stopPropagation();
        if (window.confirm(`Точно хочешь удалить "${el.value}"?`)) {
            deleter(value);
        }
    };

    // Создаем текст подсказки
    const getTooltipText = () => {
        const visualX = position.x - DATA_X_OFFSET;
        const taskEnd = visualX + weight;
        const startSprint = Math.floor(visualX / SPRINT_WIDTH);
        const endSprint = Math.floor((taskEnd - 0.001) / SPRINT_WIDTH); // -0.001 чтобы задача, заканчивающаяся точно на границе, считалась в предыдущем спринте
        
        // Задача пересекает границу спринта, если начинается и заканчивается в разных спринтах
        const crossesBoundary = startSprint !== endSprint;
        
        if (crossesBoundary) {
            return `${el.key}: ${el.value} (SP: ${el.sp})\n⚠️ Задача пересекает границу спринта ${startSprint + 1}-${endSprint + 1}\nЗадача не будет полностью готова в одном спринте`;
        } else {
            return `${el.key}: ${el.value} (SP: ${el.sp})`;
        }
    };

    return (
        <div
            style={positionStyle}
            className={'noselect'}
            onWheel={(e) => handleScroll(e)}
            title={getTooltipText()}
        >
            {/* Кнопка редактирования */}
            <div
                onClick={toggleEdit}
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 20,
                    height: 20,
                    zIndex: 999,
                    overflow: 'visible',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                }}
            >
                ✎
            </div>

            {/* Основная зона перетаскивания / контент */}
            <div
                onMouseDown={handleDragEnter}
                onTouchStart={handleDragEnter}
                onMouseUp={handleDrop}
                onTouchEnd={handleDrop}
                onMouseUpCapture={handleDrop}
                onTouchEndCapture={handleDrop}
                className={'noselect'}
                style={{
                    paddingTop: '10px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    height: 50,
                    boxSizing: 'border-box'
                }}
            >
                <div style={{
                    fontSize: '12px',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                    maxWidth: `${el.sp * 50 - 20}px`, // вычесть padding
                    lineHeight: '1.2em'
                }}>
                    <span style={{ fontWeight: 'bold' }}>{el.key}</span>: {el.value}
                </div>
                {el.type === 'Высший' && (
                    <div style={{
                        position: 'absolute',
                        top: -9,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '18px',
                        color: getColor(el.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1001
                    }}>👑</div>
                )}
            </div>

            {/* Кнопка удаления */}
            <div
                style={{
                    width: 10,
                    height: 10,
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'transparent',
                }}
                onClick={deleteElement}
            >
                ⨉
            </div>


        </div>
    );
};