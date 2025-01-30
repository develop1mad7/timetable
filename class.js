class Timetable {
    constructor(intervalStepDay) {
        this.stepDay = 0;
        this.intervalStepDay = intervalStepDay;
        this.lessons = this.getLessons();
        this.timetable = this.getTimetable();
        this.masters = this.getMasters();
        this.rooms = this.getRooms();
    }

    async useFetch(category, { dayStart, dayEnd } = {}) {
        const api = 'https://api.fitpass.ru/api/lesson';
        const key = 'club=103';
        let url = '';
        if (!dayStart || !dayEnd) {
            url = `${api}/${category}?${key}`
        } else {
            url = `${api}/${category}?${key}&dateBegin=${dayStart}&dateEnd=${dayEnd}`
        }
        return await fetch(url).then((response) => response.json()).then((data) => data.Data).catch().finally(() => console.log(`конец запроса - ${category}`))
    }

    createElement(tag) {
        return document.createElement(tag);
    }

    formateDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    getDay(data) {
        const date = new Date(data);
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('ru-RU', { month: 'short' });
        const weekDay = date.toLocaleString('ru-RU', { weekday: 'short' });
        return [day, weekDay, month];
    }

    setDate() {
        let dayStart = new Date()
        dayStart.setDate(dayStart.getDate() + this.stepDay);
        let dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 6)
        dayStart = this.formateDate(dayStart);
        dayEnd = this.formateDate(dayEnd)
        return {
            dayStart,
            dayEnd,
        }
    }

    async getTimetable() {
        const result = await this.useFetch('timetable', this.setDate());
        if (!Array.isArray(result) || !result.length) return {}
        const groupTimetable = [];
        const groupStartTime = []
        for (const day of result) {
            const date = day.Date;
            const time = day.BeginTime
            if (!groupStartTime.includes(time)) {
                groupStartTime.push(time);
            }
            if (!groupTimetable.includes(date)) {
                groupTimetable.push(date)
            }
        }
        return [groupTimetable, groupStartTime.sort(), result];
    }
    async getLessons() {
        const result = await this.useFetch('lessons');
        if (!Array.isArray(result) || !result.length) return []
        return result;
    }

    async getMasters() {
        const result = await this.useFetch('masters');
        if (!Array.isArray(result) || !result.length) return []
        const groupMasters = {}
        for (const trainer of result) {
            if (!groupMasters[trainer.ID]) {
                groupMasters[trainer.ID] = trainer.FirstName + " " + trainer.LastName;
            }
        }
        return groupMasters;
    }

    async getRooms() {
        const result = await this.useFetch('rooms');
        if (!Array.isArray(result) || !result.length) return []
        const groupRooms = {}
        for (const room of result) {
            groupRooms[room.ID] = room.Name
        }
        return groupRooms;
    }

    async showData(data) {
        console.log(await this[data])
    }

    async nextInterval() {
        this.stepDay += this.intervalStepDay;
        this.timetable = await this.getTimetable()
        console.log(this.timetable)
    }

    async prevInterval() {
        this.stepDay -= this.intervalStepDay;
        this.timetable = await this.getTimetable()
        console.log(this.timetable)
    }

    renderPopupLesson(nameLesson, dateLesson, timeLesson, durationLesson, nameRoom, descLesson, nameTrainer) {
        const overlay = this.createElement('div');
        overlay.classList.add('popup-lesson-overlay')
        const renderPopup = `
                    <div class="popup-lesson">
                    <button class="popup-lesson-close">X</button>
                        <div class="popup-lesson-grid">
                            <h3>${nameLesson}</h3>
                            <div class="popup-lesson-grid__time">
                                <h5>Условия:</h5>
                                <ul>
                                    <li>${dateLesson}${timeLesson}</li>
                                    <li>${durationLesson} минут </li>
                                    <li>${nameRoom}</li>
                                </ul>
                            </div>
                            <div class="popup-lesson-grid__desc">
                            <h5>описание:</h5>
                            <p>${descLesson ?? ''}</p>
                            </div>
                            <div class="popup-lesson-grid__trainer">
                            <h5>Ведет занятия</h5>
                            <p>${nameTrainer ?? ''}</p>
                            </div>
                            <div class="popup-lesson-grid__order">блок с обратной связью</div>
                        </div>
                    </div>`
        overlay.innerHTML = renderPopup;
        return overlay;
    }

    renderThead(timetable) {
        const elThead = this.createElement('thead');
        const elTrThead = this.createElement('tr');
        const elThPrev = this.createElement('th')
        const elThNext = this.createElement('th')
        elThPrev.textContent = '<'
        elThNext.textContent = '>'
        elTrThead.append(elThPrev);
        for (const day of timetable) {
            const [dayNumder, weekday] = this.getDay(day)
            const containerDay = this.createElement('time');
            const elTh = this.createElement('th');
            const elSpanDay = this.createElement('span');
            const elSpanWeekday = this.createElement('span');
            elSpanDay.textContent = dayNumder;
            elSpanWeekday.textContent = weekday;
            containerDay.append(elSpanDay, elSpanWeekday)
            elTh.append(containerDay);
            elTrThead.append(elTh);
        }
        elTrThead.append(elThNext);
        elThead.append(elTrThead)
        return elThead;
    }

    async renderTbody(dateLessons, timeLessons, timetableLessons) {
        const elTbody = this.createElement('tbody');
        for (const time of timeLessons) {
            const elTrBody = this.createElement('tr');
            const elTdTime = this.createElement('td');
            const elTdFake = this.createElement('td');
            elTdTime.textContent = time;
            elTrBody.append(elTdTime)
            for (const day of dateLessons) {
                const filter = timetableLessons.filter(item => item.Date === day && item.BeginTime === time)
                const elTdLesson = this.createElement('td');
                if (!filter.length) {
                    elTrBody.append(elTdLesson);
                } else {
                    for (const item of filter) {
                        console.log(item.RoomID)
                        console.log(await this.rooms[1])
                        const lesson = (await this.lessons).find(lesson => lesson.ID === item.LessonTypeID)
                        const popup = this.renderPopupLesson(lesson.Name, this.getDay(day), time, await this.rooms[0])
                        const elLesson = document.createElement('article');
                        const elTime = document.createElement('time')
                        const elPara = document.createElement('p')
                        elTime.textContent = item.DurationMinutes;
                        elPara.textContent = lesson.Name
                        elLesson.append(elTime, elPara);
                        elTdLesson.append(elLesson, popup)
                        elLesson.addEventListener('click', () => {
                            const sibling = elLesson.nextElementSibling;
                            const closePopup = sibling.children[0].children[0];
                            sibling.classList.add('popup-lesson-overlay--active')
                            closePopup.addEventListener('click', () => {
                                sibling.classList.remove('popup-lesson-overlay--active')
                            })
                        })
                    }
                    elTrBody.append(elTdLesson);
                }
            }
            elTrBody.append(elTdFake)
            elTbody.append(elTrBody)
        }
        return elTbody;
    }

    async renderTable() {
        const [dateLessons, timeLessons, timetableLessons] = await this.timetable;
        const elTable = this.createElement('table');
        const elThead = this.renderThead(dateLessons)
        const elTbody = await this.renderTbody(dateLessons, timeLessons, timetableLessons)
        // const [dayNumder, weekday, month] = this.getDay(day)

        elTable.append(elThead, elTbody);
        document.body.append(elTable);
    }
}

const timetable = new Timetable(3)
timetable.showData('lessons')
timetable.renderTable()
