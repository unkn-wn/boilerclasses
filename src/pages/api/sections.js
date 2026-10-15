import sections202720 from '@/data/sections_202720.json';

function loadPreScrapedSections(term) {
  if (term === '202720') {
    return sections202720;
  }
  return null;
}

// Fallback: Fetch a single course on-demand directly from Banner 9 if not pre-scraped
async function fetchCourseFromBanner(subject, courseNumber, term) {
  const BASE_URL = "https://apps.mypurdue.purdue.edu/StudentRegistrationSsb/ssb/";
  try {
    // 1. Initialize session
    const initRes = await fetch(`${BASE_URL}term/search?mode=search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'boilerclasses-api (+https://www.boilerclasses.com)'
      },
      body: `term=${encodeURIComponent(term)}`
    });

    const rawCookies = typeof initRes.headers.getSetCookie === 'function'
      ? initRes.headers.getSetCookie()
      : [initRes.headers.get('set-cookie')].filter(Boolean);
    const cookie = rawCookies.map(c => c.split(';')[0]).join('; ');

    // 2. Query section search
    const searchUrl = `${BASE_URL}searchResults/searchResults?txt_subject=${encodeURIComponent(subject)}&txt_courseNumber=${encodeURIComponent(courseNumber)}&txt_term=${encodeURIComponent(term)}&pageMaxSize=50`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'Cookie': cookie || '',
        'User-Agent': 'boilerclasses-api (+https://www.boilerclasses.com)'
      }
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const rawSections = searchData.data || [];
    if (!rawSections.length) return null;

    // Transform into the schema
    const courseKey = `${subject} ${courseNumber}`;
    const title = rawSections[0].courseTitle || '';
    const classesMap = {};

    for (const sec of rawSections) {
      const crn = String(sec.courseReferenceNumber);
      const secType = sec.scheduleTypeDescription || 'Lecture';
      const linkId = sec.linkIdentifier || 'DEFAULT';
      const classId = sec.isSectionLinked ? `${courseKey}_${linkId}` : `${courseKey}_${crn}`;

      if (!classesMap[classId]) {
        classesMap[classId] = {
          Id: classId,
          Sections: []
        };
      }

      const instructors = (sec.faculty || [])
        .filter(f => f.displayName)
        .map(f => ({
          Id: String(f.bannerId || f.emailAddress || f.displayName),
          Name: f.displayName,
          Email: f.emailAddress || ''
        }));

      if (!instructors.length) {
        instructors.push({ Id: 'tba', Name: 'TBA', Email: '' });
      }

      const meetings = [];
      for (let idx = 0; idx < (sec.meetingsFaculty || []).length; idx++) {
        const mt = sec.meetingsFaculty[idx].meetingTime;
        if (!mt) continue;

        const dayList = [];
        if (mt.monday) dayList.push('Monday');
        if (mt.tuesday) dayList.push('Tuesday');
        if (mt.wednesday) dayList.push('Wednesday');
        if (mt.thursday) dayList.push('Thursday');
        if (mt.friday) dayList.push('Friday');
        if (mt.saturday) dayList.push('Saturday');
        if (mt.sunday) dayList.push('Sunday');

        let duration = 'PT50M';
        if (mt.beginTime && mt.endTime && mt.beginTime.length >= 4 && mt.endTime.length >= 4) {
          const sh = parseInt(mt.beginTime.slice(0, 2), 10);
          const sm = parseInt(mt.beginTime.slice(2), 10);
          const eh = parseInt(mt.endTime.slice(0, 2), 10);
          const em = parseInt(mt.endTime.slice(2), 10);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff > 0) {
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            duration = h > 0 && m > 0 ? `PT${h}H${m}M` : h > 0 ? `PT${h}H` : `PT${m}M`;
          }
        }

        const startTime = mt.beginTime && mt.beginTime.length >= 4
          ? `${mt.beginTime.slice(0, 2)}:${mt.beginTime.slice(2)}:00.0000000`
          : null;

        meetings.push({
          Id: `${crn}_${idx}`,
          SectionId: crn,
          Type: secType,
          StartDate: mt.startDate || '',
          EndDate: mt.endDate || '',
          DaysOfWeek: dayList.join(', ') || 'None',
          StartTime: startTime,
          Duration: duration,
          Instructors: instructors,
          Room: {
            Number: mt.room || 'TBA',
            Building: {
              ShortCode: mt.building || 'TBA',
              Name: mt.buildingDescription || 'TBA'
            }
          }
        });
      }

      classesMap[classId].Sections.push({
        Id: crn,
        Crn: crn,
        Type: secType,
        StartDate: sec.startDate || '',
        EndDate: sec.endDate || '',
        Meetings: meetings
      });
    }

    return {
      Id: `${subject}_${courseNumber}`,
      Number: courseNumber,
      Subject: subject,
      Title: title,
      Classes: Object.values(classesMap)
    };
  } catch (error) {
    console.error('Error fetching course from Banner fallback:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subjectCode, courseCode, term = '202720' } = req.query;

  if (!subjectCode || !courseCode) {
    return res.status(400).json({ error: 'Missing subjectCode or courseCode' });
  }

  const courseKey = `${subjectCode.toUpperCase()} ${courseCode}`;

  // 1. Try pre-scraped internal dataset
  const preScraped = loadPreScrapedSections(term);
  if (preScraped && preScraped[courseKey]) {
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.status(200).json(preScraped[courseKey]);
  }

  // 2. Fallback: on-demand Banner fetch for courses not in pre-scraped file
  const liveCourse = await fetchCourseFromBanner(subjectCode.toUpperCase(), courseCode, term);
  if (liveCourse) {
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    return res.status(200).json(liveCourse);
  }

  return res.status(404).json({ error: 'Course sections not found' });
}
