const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

console.log(dayjs.utc(1675043042957 + 3600000).local());