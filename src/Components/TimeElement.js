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

    useEffect(()=> {
        setPosition({x: el.x, y: el.y});
        setCurrentType(el.type);
        setWeight(el.weight);
    },[el]);

    const getColor = (type) => {
      switch (type) {
          case 'none':
              return 'lightGrey';
          case 'ППРБ':
              return '#00B8D9';
          case 'КМК':
              return '#36B37E';
          case 'Согласия':
              return '#FFAB00';
          default:
              return 'lightGrey';
      }
    };

    const checkNeighbours = (x, y) => {
        // console.log('------------------------')
        // console.log('El x', x);
        // console.log('El y', y);
        // console.log('El weight', weight);
        let friendKey = '';

        const foundFriends = Object.keys(data).filter((key) => {
            // console.log('*******')
            let curX = data[key].x;
            let curY = data[key].y;
            let curW = data[key].weight;
            // console.log('curX', curX);
            // console.log('curY', curY);
            // console.log('curW', curW);
            // console.log('x + weight >= curX',x + weight >= curX)
            // console.log('x + weight <= curX + curW',x + weight <= curX + curW)
            // console.log(' y === curY', y === curY)
            if (x + weight >= curX && x + weight <= curX + curW && y === curY) {
                //console.log('veryfriend')
                friendKey = key;
                return true;
            } else {
                //console.log('NOT friend')
                return false
            }
        });
        return {key: friendKey, data: data[foundFriends[0]]};
    };

    const snapPositionToRow = (x, y) => {
        let newX = x;
        let newY = y;

        if (x % 50 !== 0) {
            newX = x - x % weight < 0 ? 0 : x - x % 50;
        } else {
            newX = x;
        }

        if (y % 50 !== 0) {
            newY = y - y % 50 < 0 ? 50 : y - y % 50;
        } else {
            newY = y;
        }

        const friend = checkNeighbours(newX, newY);
        if (!!friend && !!friend.data) {
            newX = friend.data.x - weight;
        }
        updater(value, {value: el.value, x: newX, y: newY, weight: weight, type: currentType});
        setPosition({x: newX, y: newY})
    };

    const handleDragEnter = e => {
        e.preventDefault();
        setSmthDragging(true);
        setIsDragging(true);
    };

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.button !== 2) {
            setSmthDragging(false)
            setIsDragging(false);
            snapPositionToRow(x, y);
        }
    };

    const handleScroll = e => {
        let newWeight = weight;
        if (e.deltaY < 0)
        {
            const friend = checkNeighbours(position.x+50, position.y);
            if (!!friend && !!friend.data && friend.data.x - 50 >= (position.x + weight)) {
                newWeight = weight+50;
            } else if (!friend || !friend.data) {
                newWeight = weight+50;
            }
        }
        else if (e.deltaY > 0)
        {
            if (weight-50 <=0) {
                newWeight = 50
            } else {
                newWeight = weight-50;
            }
        }
        setWeight(newWeight);
        updater(value, {value: el.value, x: position.x, y: position.y, weight: newWeight, type: currentType});
    };

    const componentStyle = {
        height: 20,
        width: 20,
        position: 'absolute',
        left: 0,
        bottom: 0
    };
    const positionStyle = {
        height: 50,
        width: weight,
        position: 'fixed',
        backgroundColor: getColor(currentType),
        boxShadow: 'inset 0px 0px 0px 2px #000',
        opacity: position.y >= 50 ? 1: 0.5
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
        setIsEditing(!isEditing)
    };

    const changeValue = (e) => {
        setCurrentValue(e.target.value);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            updater(value, {value: currentValue, x: position.x, y: position.y, weight: weight, type: currentType});
            toggleEdit();
        }
    };

    const setType = (e) => {
        setCurrentType(e.target.value);
        setSmthEditing(!isEditing);
        setIsEditing(!isEditing);
        updater(value, {value: currentValue, x: position.x, y: position.y, weight: weight, type: e.target.value});
    };

    const deleteElement = () => {
        if (window.confirm(`Точно хочешь удалить "${currentValue}"?`)) {
            deleter(value);
        }
    };

    return  (
        <div style={positionStyle}
             className={'noselect'}
             onWheel = {(e) => handleScroll(e)}
        >
            <div
                onClick={toggleEdit}
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 20,
                    height: 20,
                    zIndex: '999',
                    overflow: 'visible',
                    background: getColor(currentType),
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none'
                }}
            >
                ✎
            </div>
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
                    height:50
                }}
            >
                { !isEditing && el.value }
                { isEditing && (
                    <div>
                        <input style={{width: '75%'}} type='text' value={currentValue} inputmode="search" onChange={changeValue} onKeyDown={handleKeyDown}/>
                        <select style={{width: '18%'}} onChange={setType} value={currentType}>
                            <option>КМК</option>
                            <option>ППРБ</option>
                            <option>Согласия</option>
                        </select>
                    </div>
                )}
            </div>
            <div style={{
                width:10,
                height:10,
                backgroundColor: 'red',
                position: 'absolute',
                top: 5,
                right: 5,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'transparent',
            }} onClick={deleteElement}>⨉</div>
            <div className={'noselect'}
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
