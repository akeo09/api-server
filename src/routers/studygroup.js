const express = require('express')
const auth = require('../middleware/auth')

const StudyGroup = require('../models/studygroup')

const router = express.Router()

router.post('/studygroup', auth, async (req, res) => {
    delete req.body.owner
    delete req.body.participants

    const user = req.user

    try {
        const group = new StudyGroup({
            ...req.body,
            owner: user._id
        })

        await group.save()
        res.status(201).send()
    }
    catch (error) {
        console.log(error)
        res.status(400).send()
    }
})

router.get('/studygroups', auth, async (req, res) => {
    let filter = {
        $and: []
    }

    const projection = {
        name: 1,
        is_public: 1,
        max_participants: 1,
        description: 1,
        start_date: 1,
        end_date: 1,
        meeting_times: 1,
        school: 1,
        course_number: 1
    }

    const options = {}

    filter.$and.push({
        $or: [
            { is_public: true },
            { owner: req.user._id }
        ]
    })

    if (req.query.hasOwnProperty('ongoing')) {
        const now = new Date()
        if (req.query.ongoing === 'true') {
            filter.$and.push({ start_date: { $lte: now } })
            filter.$and.push({ end_date: { $gt: now } })
        } else {
            filter.$and.push (
                {
                    $or: [
                        { start_date: { $gt: now } },
                        { end_date: { $lt: now } }
                    ]
                }
            )
        }
    }

    if (req.query.hasOwnProperty('search')) {
        filter.$and.push({
            $text: {
                $search: req.query.search
            }
        })
    }

    console.log(JSON.stringify(filter))

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        options.sort = {}
        options.sort[parts[0]] = (parts[1] == 'asc') ? 1 : -1
    }

    if (req.query.limit) {
        options.limit = req.query.limit
    }

    if (req.query.skip) {
        options.skip = req.query.skip
    }

    try {
        const results = await StudyGroup.find(filter, projection, options)
        res.send(results)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

module.exports = router