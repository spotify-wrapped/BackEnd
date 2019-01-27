const express = require('express');
const helmet = require('helmet');

const port = process.env.PORT || 3000;

const app = express();

app.use(helmet());

app.get('/', (req, res) => {
    const name = req.query.name;

    res.send({ Hello: `${name}`})
});

app.listen(port, () => console.log(`Listening on port ${port}`));