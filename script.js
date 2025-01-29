"use strict"
let stepDay = 0;

function showLoader() {
    document.querySelector('.loader').classList.add('loader--active');
}

function hideLoader() {
    document.querySelector('.loader').classList.remove('loader--active');
}

const getDay = async (date) => {
    const dateCheck = new Date(date);
    const dayMonth = String(dateCheck.getDate()).padStart(2, '0');
    const dayWeek = dateCheck.getDay()
    const listWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return [dayMonth, listWeek[dayWeek]]
}

async function getLesson() {
    showLoader()
    const date = new Date();
    date.setDate(date.getDate() + stepDay)
    const dayStart = date.toISOString().split('T')[0];
    const dateEnd = new Date(dayStart)
    dateEnd.setDate(dateEnd.getDate() + 6)
    let futureDateString = dateEnd.toISOString().split('T')[0];
    try {
        const response = await fetch(`https://api.fitpass.ru/api/lesson/lessons?club=103&dateBegin=${dayStart}&dateEnd=${futureDateString}`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
        }
        const data = await response.json()

        return data.Data
    } catch (error) {
        console.log('Ошибка:', error)
    } finally {
        hideLoader()
    }


}

async function getMaster() {
    try {
        const response = await fetch('https://api.fitpass.ru/api/lesson/masters?club=103')
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
        }
        const data = await response.json()

        return data.Data
    } catch {
        console.log('Ошибка:', error)
    }
}

async function getRoom() {
    try {
        const response = await fetch('https://api.fitpass.ru/api/lesson/rooms?club=103')
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
        }
        const data = await response.json()

        return data.Data
    } catch {
        console.log('Ошибка:', error)
    }
}

async function getTimetable() {
    showLoader()
    const date = new Date();
    date.setDate(date.getDate() + stepDay)
    const dayStart = date.toISOString().split('T')[0];
    const dateEnd = new Date(dayStart)
    dateEnd.setDate(dateEnd.getDate() + 6)
    let futureDateString = dateEnd.toISOString().split('T')[0];
    try {
        const response = await fetch(`https://api.fitpass.ru/api/lesson/timetable?club=103&dateBegin=${dayStart}&dateEnd=${futureDateString}`)
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
        }
        const data = await response.json()
        return data.Data
    } catch (error) {
        console.log('Ошибка:', error)
    } finally {
        hideLoader()
    }
}

const groupMasters = async (masters) => {
    const groupMasters = {};
    for (const trainer of await masters) {
        groupMasters[trainer.ID] = {
            TrainerName: `${trainer.FirstName} ${trainer.LastName}`
        }
    }
    return groupMasters
}

const groupRooms = async (rooms) => {
    const groupRoomsList = {};
    for (const room of await rooms) {
        groupRoomsList[room.ID] = {
            NameRoom: room.Name
        }
    }
    return groupRoomsList
}

const groupLesson = async (lesson) => {
    const lessonID = {}
    for (const item of await lesson) {
        lessonID[item.ID] = {
            CategoryName: item.CategoryName,
            Description: item.Description,
            NameLesson: item.Name
        }
    }
    return lessonID
}

const groupTimetable = async (timetable) => {
    const getLessonList = await groupLesson(getLesson())
    const getMastersList = await groupMasters(getMaster());
    const getRooms = await groupRooms(getRoom());
    const groupTimetableList = {}
    const groupTimelesson = []
    for (const item of await timetable) {
        if (!groupTimetableList[item.Date]) {
            groupTimetableList[item.Date] = {}
        }
        if (item.Date in groupTimetableList) {
            const { CategoryName, Description, NameLesson } = getLessonList[item.LessonTypeID]
            const { TrainerName } = getMastersList[item.MasterID];
            const { NameRoom } = getRooms[item.RoomID];
            if (!groupTimelesson.includes(item.BeginTime)) {
                groupTimelesson.push(item.BeginTime)
            }
            groupTimetableList[item.Date][item.BeginTime] = {
                DurationMinutes: item.DurationMinutes,
                NameLesson,
                CategoryName,
                Description,
                TrainerName,
                MasterID: item.MasterID,
                RoomID: item.RoomID,
                NameRoom,
            }
        }
    }
    return [groupTimetableList, groupTimelesson.sort()]
}
const [timetableList, timeLessonList] = await groupTimetable(getTimetable())

const renderTimeLesson = async (timeLessons) => {
    const timeList = [];
    for (const item of await timeLessons) {
        const $time = document.createElement('time');
        $time.textContent = item;
        timeList.push($time)
    }
    console.log(timeList)
    return timeList;
}

const renderTimetableLesson = async (timetable, timeLesson) => {
    document.querySelector('table')?.remove()
    const $table = document.createElement('table');
    const $thead = document.createElement('thead');
    const $trThead = document.createElement('tr');
    const $tbody = document.createElement('tbody')
    const $thTheadStart = document.createElement('th')
    const $thTheadEnd = document.createElement('th')
    $thTheadStart.textContent = '<'
    $thTheadEnd.textContent = '>'
    $thTheadStart.addEventListener('click', async () => {
        if (stepDay === 0) {
            return;
        }
        document.addEventListener('readystatechange', () => console.log(document.readyState));
        stepDay -= 6;
        const [timetableList, timeLessonList] = await groupTimetable(getTimetable())
        renderTimetableLesson(timetableList, timeLessonList)
    })
    $thTheadEnd.addEventListener('click', async () => {
        stepDay += 6;
        const [timetableList, timeLessonList] = await groupTimetable(getTimetable())
        const lenTimetable = Object.keys(timetableList)
        document.addEventListener('readystatechange', () => console.log(document.readyState));
        if (lenTimetable.length === 0 || lenTimetable.length < 7) {
            for (let i = lenTimetable.length, j = 1; i < 7; i++, j++) {
                let startFakeDate = new Date(lenTimetable.at(-1));
                startFakeDate.setDate(startFakeDate.getDate() + j)
                startFakeDate = startFakeDate.toISOString().split('T')[0]
                timetableList[startFakeDate] = {
                }
            }
            stepDay -= 6;
            renderTimetableLesson(timetableList, timeLessonList)
            return;
        }
        renderTimetableLesson(timetableList, timeLessonList)

    });
    $trThead.append($thTheadStart)
    $thead.append($trThead);
    $table.append($thead);
    $table.append($tbody);
    let i = 0;
    for (const time of await timeLesson) {
        const tr = document.createElement('tr')
        i++;
        const lessonList = []
        const timeTd = document.createElement('td');
        timeTd.textContent = time;
        for (const day in await timetable) {
            const td = document.createElement('td')
            if (timetable[day][time]) {
                const $lesson = document.createElement('article');
                const $time = document.createElement('time')
                const $para = document.createElement('p')
                const renderPopup = `
                <div class="popup-lesson-overlay">
                    <div class="popup-lesson">
                    <button class="popup-lesson-close">X</button>
                        <div class="popup-lesson-grid">
                            <h3>${timetable[day]?.[time]?.NameLesson ?? 'Занятий нет'}</h3>
                            <div class="popup-lesson-grid__time">
                                <h5>Условия:</h5>
                                <ul>
                                    <li>${(await getDay(day)).join(' ') + ', '}${time}</li>
                                    <li>${timetable[day]?.[time]?.DurationMinutes ?? '0'} минут </li>
                                    <li>${timetable[day]?.[time]?.NameRoom ?? 'Занятий нет'}</li>
                                </ul>
                            </div>
                            <div class="popup-lesson-grid__desc">
                            <h5>описание:</h5>
                            <p>${timetable[day]?.[time]?.Description ?? ''}</p>
                            </div>
                            <div class="popup-lesson-grid__trainer">
                            <h5>Ведет занятия</h5>
                            <p>${timetable[day]?.[time]?.TrainerName ?? ''}</p>
                            </div>
                            <div class="popup-lesson-grid__order">блок с обратной связью</div>
                        </div>
                    </div>
                </div>`
                $lesson.addEventListener('click', () => {
                    const sibling = $lesson.nextElementSibling;
                    const closePopup = sibling.children[0].children[0];
                    sibling.classList.add('popup-lesson-overlay--active')
                    closePopup.addEventListener('click', () => {
                        sibling.classList.remove('popup-lesson-overlay--active')
                    })
                })
                $time.textContent = timetable[day]?.[time]?.DurationMinutes
                $para.textContent = timetable[day]?.[time]?.NameLesson
                $lesson.append($time, $para)
                td.append($lesson)
                td.insertAdjacentHTML('beforeend', renderPopup)
            }
            lessonList.push(td)
        }
        tr.append(timeTd, ...lessonList,)
        $tbody.append(tr)
    }

    for (const item in await timetable) {
        const [day, weekDay] = await getDay(item);
        const $date = document.createElement('div')
        const $day = document.createElement('span')
        const $dayWeek = document.createElement('span')
        $day.textContent = day;
        $dayWeek.textContent = weekDay;
        $date.append($day, $dayWeek);
        const $th = document.createElement('th')
        const tdTr = document.createElement('td')
        tdTr.textContent = timeLesson[i++];
        $th.append($date)
        $trThead.append($th)
    }
    $trThead.append($thTheadEnd)
    document.body.append($table)
}

renderTimetableLesson(timetableList, timeLessonList)