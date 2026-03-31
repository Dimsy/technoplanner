import '../App.css';
import { useEffect, useState } from 'react';

// value === key!11
export const TimeElement = ({el, value, x, y, setSmthDragging, updater, data, setSmthEditing, deleter}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({x: el.x, y: el.y});
    const [weight, setWeight] = useState(el.weight);
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(el.value);
    const [currentType, setCurrentType] = useState(el.type);

    useEffect(() => {
        setPosition({x: el.x, y: el.y});
        setCurrentType(el.type);
        setWeight(el.weight);
    }, [el]);

    const getColor = (type) => {
        switch (type) {
            case 'none':     return 'lightGrey';
            case 'Тип1':      return '#36B37E';
            case 'Тип2':     return '#00B8D9';
            case 'Тип3': return '#FFAB00';
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
        let newX = rawX % 50 !== 0
            ? Math.max(0, rawX - (rawX % 50))
            : rawX;

        let newY = rawY % 50 !== 0
            ? Math.max(50, rawY - (rawY % 50))
            : rawY;

        // Проверяем коллизии и сдвигаем элемент вправо за крайний блокирующий блок
        const collisions = findCollisions(newX, newY, weight);

        if (collisions.length > 0) {
            // Находим правый край самого правого пересекающегося элемента
            const rightmostEdge = Math.max(...collisions.map((c) => c.x + c.weight));
            newX = rightmostEdge;
        }

        updater(value, { value: el.value, x: newX, y: newY, weight, type: currentType });
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
            // Компенсируем то же смещение, что используется при визуальном отображении
            snapPositionToRow(x - 10, y - 40);
        }
    };

    const handleScroll = (e) => {
        let newWeight = weight;

        if (e.deltaY < 0) {
            // Расширяем вправо — проверяем, не заблокировано ли место
            const collisions = findCollisions(position.x, position.y, weight + 50);
            if (collisions.length === 0) {
                newWeight = weight + 50;
            }
        } else if (e.deltaY > 0) {
            newWeight = Math.max(50, weight - 50);
        }

        setWeight(newWeight);
        updater(value, { value: el.value, x: position.x, y: position.y, weight: newWeight, type: currentType });
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
        width: weight,
        position: 'fixed',
        backgroundColor: getColor(currentType),
        boxShadow: 'inset 0px 0px 0px 2px #000',
        opacity: position.y >= 50 ? 1 : 0.5,
        zIndex: isDragging ? 1000 : 1,
    };

    if (isDragging) {
        positionStyle.top = y - 40;
        positionStyle.left = x - 10;
    } else {
        positionStyle.top = position.y;
        positionStyle.left = position.x;
    }

    const toggleEdit = () => {
        setSmthEditing(!isEditing);
        setIsEditing(!isEditing);
    };

    const changeValue = (e) => setCurrentValue(e.target.value);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            updater(value, { value: currentValue, x: position.x, y: position.y, weight, type: currentType });
            toggleEdit();
        }
    };

    const setType = (e) => {
        const newType = e.target.value;
        setCurrentType(newType);
        setSmthEditing(!isEditing);
        setIsEditing(!isEditing);
        updater(value, { value: currentValue, x: position.x, y: position.y, weight, type: newType });
    };

    const deleteElement = () => {
        if (window.confirm(`Точно хочешь удалить "${currentValue}"?`)) {
            deleter(value);
        }
    };

    return (
        <div
            style={positionStyle}
            className={'noselect'}
            onWheel={(e) => handleScroll(e)}
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
                onMouseDown={e => !isEditing && handleDragEnter(e)}
                onTouchStart={e => !isEditing && handleDragEnter(e)}
                onMouseUp={e => !isEditing && handleDrop(e)}
                onTouchEnd={e => !isEditing && handleDrop(e)}
                onMouseUpCapture={e => !isEditing && handleDrop(e)}
                onTouchEndCapture={e => !isEditing && handleDrop(e)}
                className={'noselect'}
                style={{
                    paddingTop: '10px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    height: 50,
                }}
            >
                {!isEditing && el.value}
                {isEditing && (
                    <div>
                        <input
                            style={{ width: '75%' }}
                            type="text"
                            value={currentValue}
                            inputMode="search"
                            onChange={changeValue}
                            onKeyDown={handleKeyDown}
                        />
                        <select style={{ width: '18%' }} onChange={setType} value={currentType}>
                            <option>Тип1</option>
                            <option>Тип2</option>
                            <option>Тип3</option>
                        </select>
                    </div>
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

            {/* Угловая зона перетаскивания */}
            <div
                className={'noselect'}
                onMouseDown={e => handleDragEnter(e)}
                onTouchStart={e => handleDragEnter(e)}
                onMouseUp={e => handleDrop(e)}
                onTouchEnd={e => handleDrop(e)}
                onMouseUpCapture={e => handleDrop(e)}
                onTouchEndCapture={e => handleDrop(e)}
                style={componentStyle}
            >
                ⤭
            </div>
        </div>
    );
};