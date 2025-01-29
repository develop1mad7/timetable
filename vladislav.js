const profileLines = [
    {
        houseId: 42,
        services: [
            {
                check: true,
                product: "Интернет"
            },
            {
                check: true,
                product: "что-то..."
            },
        ]
    },
    {
        houseId: 4312,
        services: [
            {
                check: false,
                product: "Спортивное кресло :)"
            },
            {
                check: false,
                product: "Интернет"
            },
        ]
    },
    {
        houseId: 425,
        services: [
            {
                check: false,
                product: "Спортивное кресло :)"
            },
            {
                check: true,
                product: "Интернет"
            },
        ]
    },
    {
        houseId: 425,
        services: [
            {
                check: false,
                product: "Телевизор"
            },
            {
                check: false,
                product: "Видеонаблюдение"
            },
        ]
    },
]

const checkObj = obj => {
    const internet = obj["Интернет"] ?? null;
    const video = obj["Видеонаблюдение"] ?? null;
    return internet === true && video === false
}


const checkServices = arr => {
    const obj = {}
    for (let i = 0, len = arr.length; i < len; i++) {
        if (!obj[arr[i].houseId]) {
            obj[arr[i].houseId] = {}
        }
        for (const service of arr[i].services) {
            if (service.product === 'Интернет' || service.product === 'Видеонаблюдение') {
                obj[arr[i].houseId][service.product] = service.check
            }
        }
        const hasInternet = 'Интернет' in obj[arr[i].houseId]
        const hasVideo = 'Видеонаблюдение' in obj[arr[i].houseId]
        if (hasVideo && hasInternet) {
            return checkObj(obj[arr[i].houseId])
        }
    }
}

checkServices(profileLines)