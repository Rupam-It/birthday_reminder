require('dotenv').config();
const nodemailer = require('nodemailer');
const express= require("express");
const bodyParser= require("body-parser");
const mongoose = require("mongoose");
const path= require("path");


const app= express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect("mongodb://0.0.0.0:27017/birthdayDB");

const birthInfo= new mongoose.Schema({
    name:String,
    place:String,
    date: Date
});

const Birthday = mongoose.model('Birthday', birthInfo);

// this function will send email
function sendEmail(name, currentDate, currentMonth) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.FROM,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.FROM,
        to: process.env.FROM,
        subject: `Birthday of ${name}`,
        text: `${name}'s birthday is on ${currentDate} ${currentMonth}. Celebrate joyfully! `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error(error);
        }
        console.log('Email sent: ' + info.response);
    });
}

app.get("/",(req,res)=>{
    res.redirect("/birthdays");
})

app.get("/add",(req,res)=>{
    res.render("form");
});

app.post('/addEvent', (req, res) => {
    const { name, place, date } = req.body;
    const newEvent = new Birthday({
        name,
        place,
        date
    });

    newEvent.save()
        .then(event => {
            console.log('Event saved:', event);
            res.redirect('/birthdays'); // Redirect to the form page after saving
        })
        .catch(error => {
            console.error('Error saving event:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Assuming you have already defined your Birthday model and connected to your database

app.get('/birthdays', (req, res) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    Birthday.find({})
        .then(birthdays => {
            const sortedBirthdays = birthdays.sort((a, b) => {
                const monthDiffA = a.date.getMonth() - currentMonth;
                const monthDiffB = b.date.getMonth() - currentMonth;

                if (monthDiffA !== monthDiffB) {
                    return monthDiffA - monthDiffB;
                }

                const dayDiffA = a.date.getDate() - currentDay;
                const dayDiffB = b.date.getDate() - currentDay;

                return dayDiffA - dayDiffB;
            });
// logic
            const nextBirthdayIndex = sortedBirthdays.findIndex(birthday => {
                const birthdayMonth = birthday.date.getMonth();
                const birthdayDay = birthday.date.getDate();
            
                if (birthdayMonth > currentMonth) {
                    return true;
                } else if (birthdayMonth === currentMonth && birthdayDay > currentDay) {
                    return true;
                }
            
                return false;
            });
            
            let upcomingBirthdayQueue = [];
            if (nextBirthdayIndex !== -1) {
                upcomingBirthdayQueue = [...sortedBirthdays.slice(nextBirthdayIndex), ...sortedBirthdays.slice(0, nextBirthdayIndex)];
            }

// console.log(upcomingBirthdayQueue);

            //old logic
            const todayBirthdays = [];
            const upcomingBirthdays = [];
            // console.log(sortedBirthdays);
            if(upcomingBirthdayQueue.length!==0){
            upcomingBirthdayQueue.forEach(birthday => {
                // console.log(birthday);
                const birthdayMonth = birthday.date.getMonth();
                const birthdayDay = birthday.date.getDate();
                if (birthdayMonth === currentMonth && birthdayDay === currentDay) {
                    todayBirthdays.push(birthday);
                   const  birthday_name= birthday.name;
                   const  cur_date= birthday.date.getDate();
                   const  cur_month= birthday.date.getMonth();
                    // sendEmail(birthday_name,cur_date,months[cur_month]);
                } else {
                    upcomingBirthdays.push(birthday);
                }
            });
        }
            else{
                sortedBirthdays.forEach(birthday => {
                // console.log(birthday);
                const birthdayMonth = birthday.date.getMonth();
                const birthdayDay = birthday.date.getDate();
                if (birthdayMonth === currentMonth && birthdayDay === currentDay) {
                    todayBirthdays.push(birthday);
                   const  birthday_name= birthday.name;
                   const  cur_date= birthday.date.getDate();
                   const  cur_month= birthday.date.getMonth();
                    // sendEmail(birthday_name,cur_date,months[cur_month]);
                } else {
                    upcomingBirthdays.push(birthday);
                }
            })

        }
            res.render('birthdays', { todayBirthdays, upcomingBirthdays, months });
        })
        .catch(error => {
            console.error('Error fetching birthdays:', error);
            res.status(500).send('Internal Server Error');
        });
});



app.get("/edit",(req,res)=>{
    // console.log(req.query.id);
    Birthday.findOne({_id:req.query.id})
    .then((User)=>{
        // console.log(User);
        res.render("update",{user:User});
    })
    
});

app.post('/update', async (req, res) => {
    const { id, name, place, date } = req.body;
 console.log(id);
    try {
        const updatedUser = await Birthday.findByIdAndUpdate(id, { name, place, date }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        else{
            console.log("updated successfully");
            res.redirect("/birthdays");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



app.get("/delete", async (req, res) => {
    const id = req.query.id;

    try {
        const deletedUser = await Birthday.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        else{
            console.log("deleted successfully");
            res.redirect("/birthdays");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.listen(3000,function(req,res){
console.log("server is running at 3000");
});