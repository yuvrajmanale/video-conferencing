// import mongoose, { Schema } from "mongoose";



// const mettingSchema = new Schema(
//     {
//         user_id : {type: String},
//         mettingCode : {type: String, required: true},
//         date : {type:Date.UTC, default: Date.now, required : true}

//     }
// )

// const Metting = mongoose.model("Metting", mettingSchema);

// export {metting};


import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema({
    user_id: {
        type: String
    },
    meetingCode: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;