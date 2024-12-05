
export const dayOrder = {
  'Mon': 0,
  'Tue': 1,
  'Wed': 2,
  'Thu': 3,
  'Fri': 4,
  'None': 5
};

export const sortByTime = (a, b) => {
  if (a === "No Meeting Time") return 1;
  if (b === "No Meeting Time") return -1;

  const getTimeValue = (time) => {
    const [hour, minute] = time.split(':');
    const isPM = time.includes('PM');
    let hourNum = parseInt(hour);
    if (isPM && hourNum !== 12) hourNum += 12;
    if (!isPM && hourNum === 12) hourNum = 0;
    return hourNum * 60 + parseInt(minute);
  };

  return getTimeValue(a) - getTimeValue(b);
};

export const sortByFirstDay = (a, b) => {
  const firstDayA = a.day[0] || 'None';
  const firstDayB = b.day[0] || 'None';
  return dayOrder[firstDayA] - dayOrder[firstDayB];
};