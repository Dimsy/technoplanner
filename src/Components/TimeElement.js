import '../App.css';
import { useState } from 'react';

// value === key!11
export const TimeElement = ({el, value, x, y, setSmthDragging, updater, data, setSmthEditing, deleter, onEdit}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({x: el.x, y: el.y});
    const [weight, setWeight] = useState(el.weight);

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
        // Привязываем левый верхний угол элемента к сетке относительно курсора
        let newX = Math.floor(x / 50) * 50;
        let newY = Math.floor(y / 50) * 50;
        if (newY < 50) newY = 50;

        // Проверяем коллизии и сдвигаем элемент вправо за крайний блокирующий блок
        const collisions = findCollisions(newX, newY, weight);

        if (collisions.length > 0) {
            // Находим правый край самого правого пересекающегося элемента
            const rightmostEdge = Math.max(...collisions.map((c) => c.x + c.weight));
            newX = rightmostEdge;
        }

        // Проверяем, не пересекается ли элемент с другими после сдвига
        const newCollisions = findCollisions(newX, newY, weight);
        if (newCollisions.length > 0) {
            alert("Недостаточно SP!");
            return; // Не перемещаем элемент
        }

        // Проверяем, помещается ли элемент в новое место
        if (newX + weight > window.screen.availWidth) {
            alert("Недостаточно SP!");
            return; // Не перемещаем элемент
        }

        updater(value, { value: el.value, x: newX, y: newY, weight, type: el.type, key: el.key, sp: el.sp });
        setPosition({ x: newX, y: newY });
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setSmthDragging(true);
        setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.button !== 2) {
            setSmthDragging(false);
            setIsDragging(false);
            // Компенсируем смещение для позиционирования курсора в середине по вертикали с отступом слева
            snapPositionToRow(x - 20, y - 25);
        }
    };

    const handleScroll = (e) => {
        let newSp = el.sp;

        if (e.deltaY < 0) {
            // Расширяем вправо — проверяем, не заблокировано ли место
            const collisions = findCollisions(position.x, position.y, (el.sp + 1) * 50);
            if (collisions.length === 0) {
                newSp = el.sp + 1;
            }
        } else if (e.deltaY > 0) {
            newSp = Math.max(1, el.sp - 1);
        }

        const newWeight = newSp * 50;
        setWeight(newWeight);
        updater(value, { value: el.value, x: position.x, y: position.y, weight: newWeight, type: el.type, key: el.key, sp: newSp });
    };

    const componentStyle = {
        height: 20,
        width: 20,
        position: 'absolute',
        left: 0,
        bottom: 0,
    };

    const positionStyle = {
        height: 50,
        width: el.sp * 50,
        position: 'fixed',
        backgroundColor: getColor(el.type),
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
        opacity: position.y >= 50 ? 1 : 0.5,
        zIndex: isDragging ? 1000 : 1,
    };

    if (isDragging) {
        positionStyle.top = y - 25;
        positionStyle.left = x - 20;
    } else {
        positionStyle.top = position.y;
        positionStyle.left = position.x;
    }

    const toggleEdit = () => {
        onEdit(value, el);
    };

    const deleteElement = () => {
        if (window.confirm(`Точно хочешь удалить "${el.value}"?`)) {
            deleter(value);
        }
    };

    return (
        <div
            style={positionStyle}
            className={'noselect'}
            onWheel={(e) => handleScroll(e)}
            title={`${el.key}: ${el.value} (SP: ${el.sp})`}
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