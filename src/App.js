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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

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
        const taskNumber = Object.keys(data).length + 1;
        setData((prev) => {
            const newData = {
                ...prev,
                [uuidv4()]: {
                    value: 'Новая активность',
                    x: 100,
                    y: 100,
                    weight: 150,
                    type: 'Средний',
                    key: `TASK-${taskNumber}`,
                    sp: 3,
                },
            };
            saveData(newData);
            return newData;
        });
    }, [data, saveData]);

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

    const onEdit = useCallback((key, task) => {
        setEditingTask({ uuid: key, ...task });
        setIsModalOpen(true);
    }, []);

    const saveEditedTask = useCallback(() => {
        if (editingTask) {
            updateElement(editingTask.uuid, {
                value: editingTask.value,
                x: editingTask.x,
                y: editingTask.y,
                weight: editingTask.sp * 50,
                type: editingTask.type,
                key: editingTask.key,
                sp: editingTask.sp,
            });
            setIsModalOpen(false);
            setEditingTask(null);
        }
    }, [editingTask, updateElement]);

    const cancelEdit = useCallback(() => {
        setIsModalOpen(false);
        setEditingTask(null);
    }, []);

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
                        onEdit={onEdit}
                    />
                ))}
            </CalendarBG>
            {isModalOpen && editingTask && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        minWidth: '300px',
                    }}>
                        <h3>Редактировать задачу</h3>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Ключ:</label>
                            <input
                                type="text"
                                value={editingTask.key}
                                onChange={(e) => setEditingTask({ ...editingTask, key: e.target.value })}
                                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Название:</label>
                            <input
                                type="text"
                                value={editingTask.value}
                                onChange={(e) => setEditingTask({ ...editingTask, value: e.target.value })}
                                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>SP (Story Points):</label>
                            <input
                                type="number"
                                value={editingTask.sp}
                                onChange={(e) => setEditingTask({ ...editingTask, sp: parseInt(e.target.value) || 0, weight: (parseInt(e.target.value) || 0) * 50 })}
                                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Тип:</label>
                            <select
                                value={editingTask.type}
                                onChange={(e) => setEditingTask({ ...editingTask, type: e.target.value })}
                                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                            >
                                <option>Высший</option>
                                <option>Высокий</option>
                                <option>Средний</option>
                                <option>Низкий</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={cancelEdit} style={{ padding: '5px 10px' }}>Отмена</button>
                            <button onClick={saveEditedTask} style={{ padding: '5px 10px', backgroundColor: '#36B37E', color: 'white', border: 'none', borderRadius: '4px' }}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;