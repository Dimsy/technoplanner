const express = require('express');
const app = express();
const port = 9000;
const fs = require('fs');
const cors = require('cors');

app.use(cors())
app.use(express.json());

app.use(express.static('build'));

app.get('/getSchedule', (req, res) => {
    let rawdata = fs.readFileSync('data.json');
    let sheduleData = JSON.parse(rawdata);
    res.send(sheduleData)
});

app.post('/saveSchedule', (req, res) => {
    console.log(req.body);
    let data = JSON.stringify(req.body);
    fs.writeFileSync('data.json', data);
    res.sendStatus(200)
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
