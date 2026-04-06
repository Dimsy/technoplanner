import './App.css';
import { v4 as uuidv4 } from 'uuid';
import { TimeElement } from "./Components/TimeElement";
import { CalendarBG } from "./Components/CalendarBG";
import PeopleList from "./Components/PeopleList";
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';

const INITIAL_DATA = {};

const CELL_SIZE = 50;
const SPRINT_WIDTH = 500; // 10 ячеек × 50px
const TOTAL_SPRINTS = 26;
const TOTAL_WIDTH = TOTAL_SPRINTS * SPRINT_WIDTH; // 13000px
const ROW_HEIGHT = 50;

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
    // const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false); // Зарезервировано для будущего использования
    const [editingPerson, setEditingPerson] = useState(null);
    const [selectedSprint, setSelectedSprint] = useState(null); // null - все спринты, 0-25 - конкретный спринт

    const getAssigneeRow = useCallback((assigneeId) => {
        const idx = people.findIndex(p => p.id === assigneeId);
        return idx >= 0 ? idx * ROW_HEIGHT : 0;
    }, [people]);

    const isDraggingRef = useRef(isDragging);
    const isEditingRef = useRef(isEditing);

    useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
    useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

    // const mousePos = usePointerPosition(isDragging); // Зарезервировано для будущего использования

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
                    weight: 3 * CELL_SIZE, // 3 SP × 50px
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
                weight: editingTask.sp * CELL_SIZE,
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

    const handleResetSprintSelection = useCallback(() => {
        setSelectedSprint(null);
    }, []);

    return (
        <div className="App">
            <PeopleList 
                people={people} 
                tasks={data} 
                selectedSprint={selectedSprint}
                onAddPerson={() => setEditingPerson({ id: uuidv4(), name: '' })}
                onAddTask={addElement}
                onEditPerson={(person) => setEditingPerson(person)}
                onResetSprintSelection={handleResetSprintSelection}
            />
            <div style={{
                position: 'fixed',
                left: '220px', // Ширина панели людей
                top: 0,
                right: 0,
                bottom: 0,
                overflowX: 'auto',
                overflowY: 'hidden',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    width: TOTAL_WIDTH + 'px', // 26 спринтов × 500px
                    height: 'calc(100vh - 50px)', // Высота окна минус высота заголовка спринтов
                    position: 'relative',
                    overflowY: 'hidden'
                }}>
                    <CalendarBG 
                        data={data} 
                        selectedSprint={selectedSprint}
                        onSprintSelect={setSelectedSprint}
                    >
                        {Object.keys(data).map((key) => (
                            <TimeElement
                                key={key}
                                el={data[key]}
                                value={key}
                                data={data}
                                setSmthDragging={setIsDragging}
                                setSmthEditing={setIsEditing}
                                updater={updateElement}
                                deleter={deleteElement}
                                onEdit={onEdit}
                            />
                        ))}
                    </CalendarBG>
                </div>
            </div>
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
                                onChange={(e) => setEditingTask({ ...editingTask, sp: parseInt(e.target.value) || 0, weight: (parseInt(e.target.value) || 0) * CELL_SIZE })}
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
            
            {/* Модальное окно для добавления/редактирования человека */}
            {editingPerson && (
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
                        backgroundColor: '#2c3e50',
                        padding: '25px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        minWidth: '350px',
                        maxWidth: '500px',
                        border: '2px solid #34495e'
                    }}>
                        <h3 style={{ 
                            color: '#ecf0f1', 
                            marginBottom: '20px',
                            textAlign: 'center',
                            borderBottom: '2px solid #3498db',
                            paddingBottom: '10px'
                        }}>
                            {editingPerson.id && people.find(p => p.id === editingPerson.id) ? '✏️ Редактировать человека' : '👤 Добавить человека'}
                        </h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                color: '#bdc3c7', 
                                marginBottom: '8px',
                                fontWeight: '500'
                            }}>
                                Имя:
                            </label>
                            <input
                                type="text"
                                value={editingPerson.name}
                                onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    backgroundColor: '#34495e',
                                    border: '1px solid #2c3e50',
                                    borderRadius: '6px',
                                    color: '#ecf0f1',
                                    fontSize: '14px'
                                }}
                                placeholder="Введите имя человека"
                                autoFocus
                            />
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            gap: '10px'
                        }}>
                            <button 
                                onClick={() => setEditingPerson(null)}
                                style={{ 
                                    padding: '12px 20px', 
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    flex: 1,
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={() => {
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
                                }}
                                style={{ 
                                    padding: '12px 20px', 
                                    backgroundColor: '#27ae60',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    flex: 1,
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#229954'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27ae60'}
                            >
                                {editingPerson.id && people.find(p => p.id === editingPerson.id) ? 'Сохранить' : 'Добавить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;