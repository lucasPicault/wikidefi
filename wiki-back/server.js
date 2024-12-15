const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Test Server Running');
});

app.listen(8080, () => {
  console.log('Test server running on port 3000');
});
