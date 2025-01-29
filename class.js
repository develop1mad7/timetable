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

    formateDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
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
        const lessons = await this.lessons;
        const masters = await this.masters;
        const rooms = await this.rooms;
        const groupTimetable = {};
        const groupStartTime = []
        for (const day of result) {
            const date = day.Date;
            const time = day.BeginTime
            if (!groupStartTime.includes(time)) {
                groupStartTime.push(time);
            }
            if (!groupTimetable[date]) {
                groupTimetable[date] = {}
            }
            if (!groupTimetable[date][time]) {
                groupTimetable[date][time] = [
                ]
            }
            groupTimetable[date][time].push({
                durationLesson: day.DurationMinutes,
                nameTrainerLesson: masters[day.MasterID],
                roomLesson: rooms[day.RoomID],
                ...lessons[day.LessonTypeID],
            })
        }
        return [groupTimetable, groupStartTime.sort()];
    }
    async getLessons() {
        const result = await this.useFetch('lessons');
        if (!Array.isArray(result) || !result.length) return {}
        const groupLessons = {};
        for (const lesson of result) {
            groupLessons[lesson.ID] = {
                nameLesson: lesson.Name,
                descLesson: lesson.Description,
                categoryLesson: lesson.CategoryName,
            }
        }
        return groupLessons;
    }

    async getMasters() {
        const result = await this.useFetch('masters');
        if (!Array.isArray(result) || !result.length) return {}
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
        if (!Array.isArray(result) || !result.length) return {}
        const groupRooms = {}
        for (const room of result) {
            groupRooms[room.ID] = room.Name
        }
        return groupRooms;
    }

    async showData(data) {
        console.log(await this[data])
    }

    async updateInterval() {
        this.stepDay += this.intervalStepDay;
        this.timetable = await this.getTimetable()
        console.log(this.timetable)
        return this.timetable
    }

    async renderTable() {

    }
}

const timeTable = new Timetable(3)
timeTable.showData('timetable')
