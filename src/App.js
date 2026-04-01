import './App.css';
import { v4 as uuidv4 } from 'uuid';
import { TimeElement } from "./Components/TimeElement";
import { CalendarBG } from "./Components/CalendarBG";
import PeopleList from "./Components/PeopleList";
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';

const INITIAL_DATA = {};

const LEFT_PANEL_WIDTH = 220;

const ADD_BUTTON_STYLE = {
    position: 'fixed',
    left: LEFT_PANEL_WIDTH + 10,
    top: 0,
    zIndex: 900,
};

const AUTO_REFRESH_INTERVAL = 3000;

const TEST_PEOPLE = [
    { id: uuidv4(), name: 'Иван Иванов' },
    { id: uuidv4(), name: 'Петр Петров' },
    { id: uuidv4(), name: 'Сидор Сидоров' },
    { id: uuidv4(), name: 'Алексей Алексеев' },
    { id: uuidv4(), name: 'Мария Мариева' },
    { id: uuidv4(), name: 'Ольга Ольгина' },
    { id: uuidv4(), name: 'Дмитрий Дмитриев' },
    { id: uuidv4(), name: 'Елена Еленова' },
    { id: uuidv4(), name: 'Владимир Владимиров' },
    { id: uuidv4(), name: 'Анна Аннова' },
    { id: uuidv4(), name: 'Сергей Сергеев' },
    { id: uuidv4(), name: 'Татьяна Татьянина' },
];

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
    const [people, setPeople] = useState(TEST_PEOPLE);
    const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);

    const getAssigneeRow = useCallback((assigneeId) => {
        const idx = people.findIndex(p => p.id === assigneeId);
        return idx >= 0 ? idx * 50 : 0;
    }, [people]);

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
                    y: 0,
                    weight: 150,
                    type: 'Средний',
                    key: `TASK-${taskNumber}`,
                    sp: 3,
                    assignee: null,
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
            const assigneeRow = editingTask.assignee ? getAssigneeRow(editingTask.assignee) : editingTask.y;
            updateElement(editingTask.uuid, {
                value: editingTask.value,
                x: editingTask.x,
                y: assigneeRow,
                weight: editingTask.sp * 50,
                type: editingTask.type,
                key: editingTask.key,
                sp: editingTask.sp,
                assignee: editingTask.assignee,
            });
            setIsModalOpen(false);
            setEditingTask(null);
        }
    }, [editingTask, updateElement, getAssigneeRow]);

    const cancelEdit = useCallback(() => {
        setIsModalOpen(false);
        setEditingTask(null);
    }, []);

    return (
        <div className="App">
            <button onClick={addElement} style={ADD_BUTTON_STYLE}>
                Добавить
            </button>
            <button onClick={() => setIsPeopleModalOpen(true)} style={{ position: 'fixed', left: 300, top: 0, zIndex: 900 }}>
                Люди
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
            <PeopleList people={people} tasks={data} />
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
                        <div style={{ marginBottom: '10px' }}>
                            <label>Исполнитель:</label>
                            <select
                                value={editingTask.assignee || ''}
                                onChange={(e) => {
                                    const chosen = e.target.value || null;
                                    const rowY = chosen ? getAssigneeRow(chosen) : editingTask.y;
                                    setEditingTask({ ...editingTask, assignee: chosen, y: rowY });
                                }}
                                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                            >
                                <option value="">Не назначен</option>
                                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={cancelEdit} style={{ padding: '5px 10px' }}>Отмена</button>
                            <button onClick={saveEditedTask} style={{ padding: '5px 10px', backgroundColor: '#36B37E', color: 'white', border: 'none', borderRadius: '4px' }}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
            {isPeopleModalOpen && (
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
                        minWidth: '400px',
                        maxHeight: '80%',
                        overflowY: 'auto',
                    }}>
                        <h3>Управление людьми</h3>
                        <ul>
                            {people.map(p => (
                                <li key={p.id} style={{ marginBottom: '10px' }}>
                                    {p.name}
                                    <button onClick={() => setEditingPerson(p)} style={{ marginLeft: '10px' }}>Редактировать</button>
                                    <button onClick={() => setPeople(prev => prev.filter(pp => pp.id !== p.id))} style={{ marginLeft: '10px' }}>Удалить</button>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setEditingPerson({ id: uuidv4(), name: '' })} style={{ marginTop: '10px' }}>Добавить человека</button>
                        {editingPerson && (
                            <div style={{ marginTop: '20px' }}>
                                <label>Имя:</label>
                                <input
                                    type="text"
                                    value={editingPerson.name}
                                    onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                                    style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                                />
                                <button onClick={() => {
                                    if (editingPerson.name.trim()) {
                                        setPeople(prev => {
                                            const existing = prev.find(p => p.id === editingPerson.id);
                                            if (existing) {
                                                return prev.map(p => p.id === editingPerson.id ? editingPerson : p);
                                            } else {
                                                return [...prev, editingPerson];
                                            }
                                        });
                                        setEditingPerson(null);
                                    }
                                }} style={{ marginTop: '10px', padding: '5px 10px' }}>Сохранить</button>
                                <button onClick={() => setEditingPerson(null)} style={{ marginTop: '10px', marginLeft: '10px', padding: '5px 10px' }}>Отмена</button>
                            </div>
                        )}
                        <button onClick={() => setIsPeopleModalOpen(false)} style={{ marginTop: '20px', padding: '5px 10px' }}>Закрыть</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;