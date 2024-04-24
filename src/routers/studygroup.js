const express = require('express')
const auth = require('../middleware/auth')

const StudyGroup = require('../models/studygroup')
const User = require('../models/user');

const router = express.Router()
const mongoose = require('mongoose') 

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
    const {search, ongoing, my_groups} = req.query;
    
    let filter = {
        $and: []
    }

    if (my_groups === 'true') {
        filter.$and.push({ owner: req.user._id });
    }

    const projection = {
        name: 1,
        owner: 1,
        is_public: 1,
        max_participants: 1,
        description: 1,
        start_date: 1,
        end_date: 1,
        meeting_times: 1,
        school: 1,
        course_number: 1
        //participants: 1
    }

    //projection['participants.name'] = 1;

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
        const results = await StudyGroup.find(filter, projection, options).populate('participants').populate('owner');
        res.send(results)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

router.patch('/studygroup/:id', auth, async (req, res) => {
    const user = req.user
    const studyGroupID = req.params.id
    const mods = req.body

    let studygroup = undefined

    if (!mongoose.isValidObjectId(studyGroupID)) {
        res.status(400).send("Invalid object id");
        return;
    }

    try {
        studygroup = await StudyGroup.findById(studyGroupID).populate('participants', 'username');

        if (!studygroup) {
            res.send(400).send('Invalid study group id');
            return;
        }
    } catch (e) {
        res.status(500).send('Error finding study group')
        return;
    }

    //verify user is owner
    if (!studygroup.owner.equals(user._id)) {
        res.status(401).send("Server is down for maintenance")
        return;
    }

    const props = Object.keys(mods);
    const modifiable = [
        "name",
        "is_public",
        "max_participants",
        "start_date",
        "end_date",
        "meeting_times",
        "description",
        "school",
        "course_number"
    ]

    //check that all the props are modifiable
    const isValid = props.every((prop) => modifiable.includes(prop));

    if (!isValid) {
        res.status(400).send("One or more invalid properties")
        return;
    }

    try {
        //set new values
        props.forEach((prop) => studygroup[prop] = mods[prop]);
        await studygroup.save()

        res.send(studygroup)
    } catch (e) {
        console.log(e)
        res.status(500).send("Error saving study group")
    }
})

router.delete('/studygroup/:id', auth, async (req, res) => {
    const user = req.user
    const studyGroupId = req.params.id

    let studyGroup = null

    if(!mongoose.isValidObjectId(studyGroupId)) {
        res.status(400).send("Invalid request")
        return
    }

    try {
        studyGroup = await StudyGroup.findById(studyGroupId)

        if(!studyGroup) {
            res.status(400).send("Study group not found")
            return
        }

        //verify user is owner
        if(!studyGroup.owner.equals(user._id)) {
            res.status(401).send()
            return
        }

        await studyGroup.deleteOne()

        res.send()
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

router.patch('/studygroup/:id/participants', auth, async (req, res) => {
    const studyGroupId = req.params.id;
    const action = req.query.add ? 'add' : req.query.remove ? 'remove' : null;
    const userId = req.body.userId;

    // Ensure the action parameter is provided and valid
    if (!action || !['add', 'remove'].includes(action)) {
        return res.status(400).send('Invalid action parameter');
    }

    // Validate user ID
    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).send('Invalid user ID');
    }

    try {
        // Find the study group
        const studyGroup = await StudyGroup.findById(studyGroupId);

        if (!studyGroup) {
            return res.status(404).send('Study group not found');
        }

        // Check if the user is already a participant
        const isParticipant = studyGroup.participants.some(participant => participant.toString() === userId);

        // Perform the appropriate action based on the request
        if (action === 'add') {
            if (isParticipant) {
                return res.status(400).send('User is already a participant');
            }
            studyGroup.participants.push(userId);
        } else if (action === 'remove') {
            if (!isParticipant) {
                return res.status(400).send('User is not a participant');
            }
            studyGroup.participants = studyGroup.participants.filter(participant => participant.toString() !== userId);
        }

        // Save the updated study group
        await studyGroup.save();

        res.status(200).send('Participant ' + (action === 'add' ? 'added' : 'removed') + ' successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router