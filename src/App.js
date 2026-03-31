import './App.css';
import { v4 as uuidv4 } from 'uuid';
import { TimeElement } from "./Components/TimeElement";
import { CalendarBG } from "./Components/CalendarBG";
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';

const INITIAL_DATA = {};

const ADD_BUTTON_STYLE = {
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 900,
};

const AUTO_REFRESH_INTERVAL = 3000;

function usePointerPosition(isActive) {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!isActive) return;

        const handleMouseMove = (e) => {
            setPos({ x: e.clientX, y: e.clientY });
        };

        const handleTouchMove = (e) => {
            const touch = (e.originalEvent ?? e).touches[0]
                ?? (e.originalEvent ?? e).changedTouches[0];
            setPos({ x: touch.pageX, y: touch.pageY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isActive]);

    return pos;
}

function App() {
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(INITIAL_DATA);

    const isDraggingRef = useRef(isDragging);
    const isEditingRef = useRef(isEditing);

    useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
    useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

    const mousePos = usePointerPosition(isDragging);

    const loadData = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:9000/getSchedule');
            setData(res.data);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        }
    }, []);

    const saveData = useCallback(async (newData) => {
        try {
            await axios.post('http://localhost:9000/saveSchedule', newData);
            console.log('Сохранено!');
        } catch (err) {
            console.error('Ошибка сохранения:', err);
        }
    }, []);

    useEffect(() => {
        loadData();

        const intervalId = setInterval(() => {
            if (!isEditingRef.current && !isDraggingRef.current) {
                loadData();
            }
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [loadData]);

    const addElement = useCallback(() => {
        setData((prev) => {
            const newData = {
                ...prev,
                [uuidv4()]: {
                    value: 'Новая активность',
                    x: 100,
                    y: 100,
                    weight: 150,
                    type: 'Тип1',
                },
            };
            saveData(newData);
            return newData;
        });
    }, [saveData]);

    const updateElement = useCallback((key, newEl) => {
        setData((prev) => {
            const newData = { ...prev, [key]: newEl };
            saveData(newData);
            return newData;
        });
    }, [saveData]);

    const deleteElement = useCallback((key) => {
        setData((prev) => {
            const newData = { ...prev };
            delete newData[key];
            saveData(newData);
            return newData;
        });
    }, [saveData]);

    return (
        <div className="App">
            <button onClick={addElement} style={ADD_BUTTON_STYLE}>
                Добавить
            </button>
            <CalendarBG data={data}>
                {Object.keys(data).map((key) => (
                    <TimeElement
                        key={key}
                        el={data[key]}
                        value={key}
                        x={mousePos.x}
                        y={mousePos.y}
                        data={data}
                        setSmthDragging={setIsDragging}
                        setSmthEditing={setIsEditing}
                        updater={updateElement}
                        deleter={deleteElement}
                    />
                ))}
            </CalendarBG>
        </div>
    );
}

export default App;