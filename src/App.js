import './App.css';
import { v4 as uuidv4 } from 'uuid';
import {TimeElement} from "./Components/TimeElement";
import {CalendarBG} from "./Components/CalendarBG";
import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [mousePos, setMousePos] = useState({});
    const [isSmthDragging, setSmthDragging] = useState(false);
    const [isSmthEditing, setSmthEditing] = useState(false);
    const testData = {};

    const [data, updateData] = useState(testData);

    useEffect(()=>{
        loadData();
        setInterval(()=> {
            if (!isSmthEditing && !isSmthDragging) {
                loadData();
            }
        }, 3000);
    },[]);

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (isSmthDragging) {
                setMousePos({x: event.clientX, y: event.clientY});
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener(
                'mousemove',
                handleMouseMove
            );
        };
    }, [isSmthDragging]);

    useEffect(() => {
        const handleMouseMove = (event) => {
            var evt = (typeof event.originalEvent === 'undefined') ? event : event.originalEvent;
            var touch = evt.touches[0] || evt.changedTouches[0];
            let newX = touch.pageX;
            let newY = touch.pageY;

            if (isSmthDragging) {
                setMousePos({x: newX, y: newY });
            }
        };

        window.addEventListener('touchmove', handleMouseMove);

        return () => {
            window.removeEventListener(
                'touchmove',
                handleMouseMove
            );
        };
    }, [isSmthDragging]);

    const loadData = () => {
        axios.get('/getSchedule').then((res) => {
            //let newData = {...res.data};
            //console.log('DataAfterFetch', newData);
            //Object.keys(res.data).forEach((key) => newData[uuidv4()] = res.data[key]);
            updateData(res.data);
        })
    };

    const saveData = (newdata) => {
        axios.post('/saveSchedule', newdata).then((res) => {
            console.log('Saved!')
        })
    };

    const addElement = () => {
        console.log('click')
        const newData = {...data};
        newData[uuidv4()] = {
            value: 'Новая активность',
            x: 100,
            y:100,
            weight: 150,
            type: 'КМК'
        };

        updateData(newData);
        saveData(newData)
    };

    const updater = (value, newEl) => {
        const newData = {...data};
        newData[value] = newEl;
        updateData(newData);
        saveData(newData)
    };

    const deleter = (value) => {
        const newData = {...data};
        delete newData[value];
        updateData(newData);
        saveData(newData);
    };

    {/*<button onClick={saveAndLoadData} style={{position: 'fixed', left: 80, top: 0, zIndex: 900}}>*/}
        {/*Сохранить*/}
    {/*</button>*/}
    return (
    <div className="App">
        <button onClick={addElement} style={{position: 'fixed', left: 0, top: 0, zIndex: 900}}>
            Добавить
        </button>
        <CalendarBG data={data}>
        { Object.keys(data).map((keyel) => {
            return <TimeElement
                        el={data[keyel]}
                        value={keyel}
                        x={mousePos.x}
                        y={mousePos.y}
                        setSmthDragging={setSmthDragging}
                        updater={updater}
                        data={data}
                        setSmthEditing={setSmthEditing}
                        deleter={deleter}
                        key={keyel}/>;
        })}
        </CalendarBG>
    </div>
  );
}

export default App;
