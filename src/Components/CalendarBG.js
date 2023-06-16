import { useEffect, useState } from 'react';

export const CalendarBG = ({children, data}) => {
    const [sprintInfosT, setSprintInfosT] = useState([]);
    const [sprintInfosS, setSprintInfosS] = useState([]);
    const bgStyle = {
        position: 'absolute',
        overflow: 'hidden'
    };
    const cols = Math.round(window.screen.availWidth / 50);
    const rows = Math.round(window.screen.availHeight / 50);

    useEffect(() => {
        const sprintsCount = Math.round(window.screen.availWidth/500);
        const isprintInfosT = [];
        const isprintInfosS = [];

        for (let i=0; i< sprintsCount; i++){
            let tasks = 0;
            let sp = 0;
            Object.keys(data).forEach((key) => {
                if (data[key].x > i*500 && data[key].x <= (i+1)*500
                    || data[key].x+data[key].weight > i*500 && data[key].x+data[key].weight <= (i+1)*500) {
                    if (data[key].x+data[key].weight > (i+1)*500) {
                        sp = sp + (data[key].weight - (data[key].x+data[key].weight - (i+1)*500))/50
                    } else if (data[key].x < i*500) {
                        sp = sp + (data[key].x+data[key].weight - i*500)/50
                    } else {
                        sp = sp + data[key].weight/50;
                    }
                    tasks=tasks+1;
                }
            })
            isprintInfosT.push(tasks);
            isprintInfosS.push(sp);
        }
        setSprintInfosT(isprintInfosT)
        setSprintInfosS(isprintInfosS)
    },[data]);

    const renderDivs = () => {
        const rcols = [];
        for (let i=0; i<= rows; i++) {
            const rrows = [];
            for (let j=0; j<= cols; j++) {
                if (i >=0 && i <1) {
                    rrows.push(<div style={{
                        backgroundColor: 'white',
                        height: 50,
                        width: 50,
                        position: 'fixed',
                        top: i*50,
                        left: j*50,
                        border: '1px solid white',
                        boxSizing: 'border-box',
                        opacity: 0.6,
                        '-moz-box-sizing': 'border-box',
                        '-webkit-box-sizing': 'border-box'
                    }}></div>)
                } else if (j % 10 === 0) {
                    rrows.push(<div style={{
                        height: 50,
                        width: 50,
                        position: 'fixed',
                        top: i*50,
                        left: j*50,
                        opacity: 0.6,
                        border: '1px solid lightGrey',
                        boxSizing: 'border-box',
                        '-moz-box-sizing': 'border-box',
                        '-webkit-box-sizing': 'border-box',
                        backgroundColor: 'lightGrey'
                    }}></div>)
                } else {
                    rrows.push(<div style={{
                        position: 'fixed',
                        height: 50,
                        width: 50,
                        top: i*50,
                        left: j*50,
                        opacity: 0.6,
                        border: '1px solid lightGrey',
                        boxSizing: 'border-box',
                        '-moz-box-sizing': 'border-box',
                        '-webkit-box-sizing': 'border-box'
                    }}></div>)
                }

            }
            rcols.push(rrows)
        }
        return rcols
    };

    return (
        <div style={bgStyle}>
            {sprintInfosT.map((task,i) => <div style={{
                position: 'fixed',
                left: 50+i*10*50,
                top: 20
            }}>
                {`Всего задач: ${task} SP: ${sprintInfosS[i]}`}
            </div>)}
            {renderDivs()}
            {children.map((child) => child)}
        </div>
    )
};
