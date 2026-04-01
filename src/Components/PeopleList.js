import React from 'react';

const LEFT_PANEL_WIDTH = 220;
const ROW_HEIGHT = 50;

const PeopleList = ({ people, tasks }) => {
    const taskCounts = people.map((person, idx) => {
        const rowY = idx * ROW_HEIGHT;
        return Object.values(tasks).filter(task => task.assignee === person.id || task.y === rowY).length;
    });

    return (
        <div style={{ position: 'fixed', left: 0, top: 0, width: LEFT_PANEL_WIDTH + 'px', height: '100%', backgroundColor: '#f0f0f0', zIndex: 800 }}>
            <div style={{ height: 50, lineHeight: '50px', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #ccc' }}>
                Список людей
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
                {people.map((person, idx) => {
                    const assignedTasks = taskCounts[idx];
                    return (
                        <div key={person.id} style={{
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #eee',
                            padding: '0 10px'
                        }}>
                            <span>{person.name}</span>
                            <span style={{ fontSize: 12, color: '#888' }}>{assignedTasks} задач</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PeopleList;