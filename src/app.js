const express = require ('express')
const app = express ()

//Set port to the PORT environment variable (if it is defined),
//otherwise set it to 3000
const port = process.env.PORT || 3000

//Set up a default route ('') and return 'Hello World!' in the
//response when requests are recieved
app.get ('', (req, res) => {
        res.send ('Snow Day!')
})

//Configure the server to listen for connections on the port.
//Print to the console when ready for connections 
app.listen (port, () => {
    console.log ('Server is up on port ' + port)
})